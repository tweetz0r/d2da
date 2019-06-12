import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Player, SelectedUser } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlayerStateService {
  private _sort = 'rewardsDesc';

  public get sort() {
    return this._sort;
  }

  public set sort(val: string) {
    this._sort = val;
    this._player.next(this._player.getValue());
  }

  private _player: BehaviorSubject<Player> = new BehaviorSubject<Player>(null);
  public player: Observable<Player>;

  private _loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loading: Observable<boolean> = this._loading.asObservable();

  private _playerNotFound: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public playerNotFound: Observable<boolean> = this._playerNotFound.asObservable();

  public _signedOnUserIsCurrent: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public signedOnUserIsCurrent: Observable<boolean> = this._loading.asObservable();

  public _isSignedOn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isSignedOn: Observable<boolean> = this._loading.asObservable();

  private _refresh: Subject<void> = new Subject<void>();
  public refresh: Observable<void> = this._refresh.asObservable();

  public setPlayer(p: Player) {
    this._player.next(p);
  }

  public currPlayer(): Player {
    return this._player.getValue();
  }

  public requestRefresh() {
    this._refresh.next();
  }

  constructor(
    private bungieService: BungieService) {
    this.player = this._player.pipe(map(val => {
      PlayerStateService.sortMileStones(val, this.sort);
      return val;
    }));
    this.bungieService.selectedUserFeed.pipe().subscribe((selectedUser: SelectedUser) => {
      this._isSignedOn.next(selectedUser != null);
      this.checkSignedOnCurrent();
    });
  }

  private checkSignedOnCurrent() {
    const a = this.bungieService.selectedUser;
    const b = this._player.getValue();
    let isCurrent = false;
    if (a != null && b != null) {
      if (b.profile.userInfo.membershipId == a.userInfo.membershipId) {
        isCurrent = true;
      }
    }
    this._signedOnUserIsCurrent.next(isCurrent);
  }

  public async performSearch(platform: number, gamerTag: string, forceRefresh?: boolean): Promise<void> {
    this._playerNotFound.next(false);
    if (gamerTag == null || gamerTag.trim().length === 0) {
      return;
    }
    this._loading.next(true);
    // set player to empty unless we're refreshing in place
    if (forceRefresh !== true) {
      this._player.next(null);
    }
    const p = await this.bungieService.searchPlayer(platform, gamerTag);

    try {
      if (p != null) {
        this.checkSignedOnCurrent();
        const showZeroPtTriumphs = localStorage.getItem('show-zero-pt-triumphs') === 'true';
        const showInvisTriumphs = localStorage.getItem('show-invis-triumphs') === 'true';
        const x = await this.bungieService.getChars(p.membershipType, p.membershipId,
          ['Profiles', 'Characters', 'CharacterProgressions', 'CharacterActivities',
            'CharacterEquipment', 'CharacterInventories',
            'ProfileProgression', 'ItemObjectives', 'PresentationNodes', 'Records', 'Collectibles'
            // 'ItemSockets', 'ItemPlugStates','ItemInstances','ItemPerks','ItemStats'
            // 'ItemTalentGrids','ItemCommonData','ProfileInventories'
          ], false, false, showZeroPtTriumphs, showInvisTriumphs);
        if (x == null || x.characters == null) {
          this.handleMissingPlayer(false);
          return;
        }
        this._player.next(x);
        this.bungieService.loadWeeklyPowerfulBounties(this._player);
        this.bungieService.loadClans(this._player);
        this.bungieService.observeUpdateAggHistory(this._player);

        // need to get out of this change detection cycle to have tabs set
        // setTimeout(() => {
        //   this.setTab();
        // }, 0);


      } else {
        this.handleMissingPlayer(false);
        return;
      }
    } catch (x) {
      console.log(x);
    } finally {
      this._loading.next(false);
    }
  }

  private handleMissingPlayer(missingCharsOnly: boolean) {
    console.log('Not found: missing chars only? ' + missingCharsOnly);
    this._playerNotFound.next(true);
    this._player.next(null);
  }

  public static sortMileStones(player: Player, sort: string): Player {
    if (player == null || player.milestoneList == null) { return; }
    if (sort === 'rewardsDesc') {
      player.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return 1; }
        if (a.pl > b.pl) { return -1; }
        if (a.rewards < b.rewards) { return 1; }
        if (a.rewards > b.rewards) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'rewardsAsc') {
      player.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return -1; }
        if (a.pl > b.pl) { return 1; }
        if (a.rewards < b.rewards) { return -1; }
        if (a.rewards > b.rewards) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'resetDesc') {
      player.milestoneList.sort((a, b) => {
        if (a.resets == null && b.resets != null) { return 1; }
        if (a.resets != null && b.resets == null) { return -1; }
        if (a.resets == null && b.resets == null) { return 0; }
        if (a.resets < b.resets) { return 1; }
        if (a.resets > b.resets) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'resetAsc') {
      player.milestoneList.sort((a, b) => {

        if (a.resets == null && b.resets != null) { return -1; }
        if (a.resets != null && b.resets == null) { return 1; }
        if (a.resets == null && b.resets == null) { return 0; }
        if (a.resets < b.resets) { return -1; }
        if (a.resets > b.resets) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'nameAsc') {
      player.milestoneList.sort((a, b) => {
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'nameDesc') {
      player.milestoneList.sort((a, b) => {
        if (a.name > b.name) { return -1; }
        if (a.name < b.name) { return 1; }
        return 0;
      });
    }
    return player;
  }

}