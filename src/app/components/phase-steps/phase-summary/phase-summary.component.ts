import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { AngularFire, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2';
import { ChildComponentData } from '../../../models/child-component-data';
import { Phase } from '../../../models/phase';
import { Group } from '../../../models/group';
import { Vote } from '../../../models/vote';
import { Subscription } from 'rxjs/Subscription';
import '../../../shared/rxjs-operators';

@Component({
  selector: 'app-phase-summary',
  templateUrl: './phase-summary.component.html',
  styleUrls: ['./phase-summary.component.css']
})
export class PhaseSummaryComponent implements OnInit, OnDestroy {
  @Input() data: ChildComponentData;
  retroId: string;
  currentPhaseId: string;
  currentPhase: Phase;
  groups: Group[];
  totalVotes: Vote[];

  retroSubscription: Subscription;
  currentPhaseSubscription: Subscription;
  groupsSubscription: Subscription;
  totalVotesSubscription: Subscription;

  constructor(private af: AngularFire) { }

  ngOnInit() {
    this.retroSubscription = this.data.retroObservable.subscribe(retroVal => {
      this.retroId = retroVal.$key;
      this.currentPhaseId = retroVal.currentPhaseId;
      this.currentPhaseSubscription = this.af.database.object('phases/' + this.currentPhaseId).subscribe(currentPhaseVal => {
        this.currentPhase = currentPhaseVal;
        this.groupsSubscription = this.af.database.list('groups', {
          query: {
            orderByChild: 'phaseId',
            equalTo: this.currentPhaseId
          }
        }).subscribe(groupsVal => {
          this.groups = groupsVal;
          this.totalVotesSubscription = this.af.database.list('votes', {
            query: {
              orderByChild: 'phaseId',
              equalTo: this.currentPhaseId
            }
          }).subscribe(votesList => {
            this.totalVotes = votesList;
          });
        });
      });
    });
  }

  ngOnDestroy() {
    this.retroSubscription.unsubscribe();
    this.currentPhaseSubscription.unsubscribe();
    this.groupsSubscription.unsubscribe();
    this.totalVotesSubscription.unsubscribe();
  }

  getVoteCountForGroup(group: Group) {
    if (this.totalVotes != null) {
      return this.totalVotes.filter(vote => vote.groupId === group.$key).length;
    }
    return 0;
  }
}
