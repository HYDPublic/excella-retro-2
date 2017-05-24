import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Retro } from '../../models/retro';
import { Phase } from '../../models/phase';
import { ChildComponentData } from '../../models/child-component-data';
import { JoinRetroFormComponent } from '../join-retro-form/join-retro-form.component';
import { ChildComponent } from '../../models/child-component';
import { SubmitFeedbackComponent } from '../phase-steps/submit-feedback/submit-feedback.component';
import { GroupFeedbackComponent } from '../phase-steps/group-feedback/group-feedback.component';
import { VoteFeedbackComponent } from '../phase-steps/vote-feedback/vote-feedback.component';
import { RetroCompleteComponent } from '../retro-complete/retro-complete.component';
import { LocalStorageService } from 'angular-2-local-storage';
import { ChildComponentService } from '../../services/child-component.service';
import { ChildComponentDirective } from '../../directives/child-component-directive';

@Component({
  selector: 'app-retro',
  templateUrl: './retro.component.html',
  styleUrls: ['./retro.component.css']
})
export class RetroComponent implements OnInit {
  retroId: string;
  retroIsActive: boolean;
  retroObservable: FirebaseObjectObservable<Retro>;
  private subscription: any;
  private currentPhaseObservable: FirebaseObjectObservable<Phase>;
  private currentPhaseId: string;
  private currentPhaseStep: number;
  public user: any;
  public retroSnapshot: Retro;
  @Input() childComponent: ChildComponent;
  showAdminToolbar: boolean;
  @ViewChild(ChildComponentDirective) childComponentHost: ChildComponentDirective;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private af: AngularFire,
    private localStorageService: LocalStorageService,
    private childComponentService: ChildComponentService
  ) { }

  ngOnInit() {
    const self = this;

    this.af.auth.subscribe(user => {
      if (user) {
        self.user = user;
      } else {
        self.user = null;
      }
    });

    this.subscription = this.route.params.subscribe(params => self.retroId = params['retroId']);
    this.retroObservable = this.af.database.object('retros/' + self.retroId);
    this.retroObservable.subscribe(retroVal => {
      self.retroSnapshot = retroVal;
      self.retroIsActive = self.retroSnapshot.isActive;
      self.toggleAdminToolbar();
      self.currentPhaseId = retroVal.currentPhaseId;
      self.currentPhaseObservable = self.af.database.object('phases/' + self.currentPhaseId);
      self.currentPhaseObservable.subscribe(phaseVal => {
        self.currentPhaseStep = phaseVal.currentPhaseStep;
        self.renderPhaseStep();
      });
    });
  }

  renderPhaseStep() {
    const data = new ChildComponentData(this.retroObservable, this.currentPhaseObservable);

    if (this.retroIsActive) {
      if (this.currentPhaseStep === 1) {
        this.childComponent = new ChildComponent(SubmitFeedbackComponent, data);
      } else if (this.currentPhaseStep === 2) {
        this.childComponent = new ChildComponent(GroupFeedbackComponent, data);
      } else if (this.currentPhaseStep === 3) {
        this.childComponent = new ChildComponent(VoteFeedbackComponent, data);
      }
    } else {
      this.childComponent = new ChildComponent(RetroCompleteComponent, data);
    }

    this.childComponentService.renderChildComponent(this.childComponent, this.childComponentHost);
  }

  validateUser() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId == null) {
      this.router.navigate(['/']);
    }
  }

  toggleAdminToolbar() {
    this.showAdminToolbar =
      this.retroSnapshot.isActive
      && this.user
      && this.user.auth.uid === this.retroSnapshot.adminId;
  }
}
