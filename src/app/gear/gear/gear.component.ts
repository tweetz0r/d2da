import { Location } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatAutocompleteSelectedEvent, MatButtonToggleGroup, MatDialog, MatDialogConfig, MatPaginator, PageEvent } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { ApiInventoryBucket, ApiItemTierType, ClassAllowed, DamageType, DestinyAmmunitionType, EnergyType, InventoryItem, ItemType, NumComparison, Player, SelectedUser, Target } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { PreferredStatService } from '@app/service/preferred-stat.service';
import { TargetPerkService } from '@app/service/target-perk.service';
import { WishlistService } from '@app/service/wishlist.service';
import { ClipboardService } from 'ngx-clipboard';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { PossibleRollsDialogComponent } from '../possible-rolls-dialog/possible-rolls-dialog.component';
import { TargetArmorPerksDialogComponent } from '../target-armor-perks-dialog/target-armor-perks-dialog.component';
import { TargetArmorStatsDialogComponent } from '../target-armor-stats-dialog/target-armor-stats-dialog.component';
import { ArmorPerksDialogComponent } from './armor-perks-dialog/armor-perks-dialog.component';
import { BulkOperationsHelpDialogComponent } from './bulk-operations-help-dialog/bulk-operations-help-dialog.component';
import { GearCompareDialogComponent } from './gear-compare-dialog/gear-compare-dialog.component';
import { GearHelpDialogComponent } from './gear-help-dialog/gear-help-dialog.component';
import { Choice, GearToggleComponent } from './gear-toggle/gear-toggle.component';
import { GearUtilitiesDialogComponent } from './gear-utilities-dialog/gear-utilities-dialog.component';


@Component({
  selector: 'd2c-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearComponent extends ChildComponent implements OnInit, AfterViewInit {

  private static NUMBER_REGEX = /^\d+$/;

  public filtering: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly markChoices: Choice[] = [
    new Choice('upgrade', 'Upgrade'),
    new Choice('keep', 'Keep'),
    new Choice('infuse', 'Infuse'),
    new Choice('junk', 'Junk'),
    new Choice(null, 'Unmarked')
  ];

  readonly ammoTypeChoices: Choice[] = [
    new Choice(DestinyAmmunitionType.Primary + '', 'Primary'),
    new Choice(DestinyAmmunitionType.Special + '', 'Special'),
    new Choice(DestinyAmmunitionType.Heavy + '', 'Heavy')
  ];


  readonly classTypeChoices: Choice[] = [
    new Choice(ClassAllowed.Titan + '', 'Titan'),
    new Choice(ClassAllowed.Warlock + '', 'Warlock'),
    new Choice(ClassAllowed.Hunter + '', 'Hunter'),
    new Choice(ClassAllowed.Any + '', 'Any'),
  ];
  readonly equippedChoices: Choice[] = [
    new Choice('true', 'Equipped'),
    new Choice('false', 'Not Equipped')
  ];

  readonly autocompleteOptions: string[] = [
    'is:seasonmod',
    'is:godroll',
    'is:fixme',
    'is:light>=',
    'is:stattotal>=',
    'is:postmaster',
    'is:godrollpve',
    'is:godrollpvp',
    'is:masterwork',
    'is:light<=',
    'is:light>',
    'is:light<',
    'is:light=',
    'is:stattotal<=',
    'is:stattotal>',
    'is:stattotal<',
    'is:stattotal=',
    'is:random',
    'is:fixed',
    'is:hasmod',
    'is:locked',
    'is:unlocked',
    'is:extratagged',
    'season:worthy',
    'season:undying',
    'season:dawn',
    'season:opulence',
    'season:forge',
    'season:outlaw',

  ];


  public filteredAutoCompleteOptions: BehaviorSubject<string[]> = new BehaviorSubject([]);

  weaponTypeChoices: Choice[] = [];
  // armorTypeChoices: Choice[] = [];
  armorInventoryBucketChoices: Choice[] = [];
  weaponInventoryBucketChoices: Choice[] = [];
  energyTypeChoices: Choice[] = [];
  damageTypeChoices: Choice[] = [];

  vehicleTypeChoices: Choice[] = [];
  modTypeChoices: Choice[] = [];
  consumableTypeChoices: Choice[] = [];
  exchangeTypeChoices: Choice[] = [];
  ownerChoices: Choice[] = [];
  rarityChoices: Choice[] = [];

  @ViewChild('paginator', { static: false })
  public paginator: MatPaginator;

  @ViewChild('optionsgroup', { static: false })
  public optionsgroup: MatButtonToggleGroup;

  @ViewChild('markToggle', { static: false })
  public markToggle: GearToggleComponent;
  @ViewChild('weaponTypeToggle', { static: false })
  public weaponTypeToggle: GearToggleComponent;
  @ViewChild('ammoTypeToggle', { static: false })
  public ammoTypeToggle: GearToggleComponent;
  @ViewChild('armorInventoryBucketToggle', { static: false })
  public armorInventoryBucketToggle: GearToggleComponent;
  @ViewChild('weaponInventoryBucketToggle', { static: false })
  public weaponInventoryBucketToggle: GearToggleComponent;
  @ViewChild('energyTypeToggle', { static: false })
  public energyTypeToggle: GearToggleComponent;
  @ViewChild('damageTypeToggle', { static: false })
  public damageTypeToggle: GearToggleComponent;
  @ViewChild('vehicleTypeToggle', { static: false })
  public vehicleTypeToggle: GearToggleComponent;
  @ViewChild('modTypeToggle', { static: false })
  public modTypeToggle: GearToggleComponent;
  @ViewChild('consumableTypeToggle', { static: false })
  public consumableTypeToggle: GearToggleComponent;
  @ViewChild('exchangeTypeToggle', { static: false })
  public exchangeTypeToggle: GearToggleComponent;
  @ViewChild('classTypeToggle', { static: false })
  public classTypeToggle: GearToggleComponent;
  @ViewChild('ownerToggle', { static: false })
  public ownerToggle: GearToggleComponent;
  @ViewChild('equippedToggle', { static: false })
  public equippedToggle: GearToggleComponent;
  @ViewChild('rarityToggle', { static: false })
  public rarityToggle: GearToggleComponent;

  // filters: GearToggleComponent[] = [];
  filtersDirty = false;
  filterNotes: string[] = [];


  private static HIGHLIGHT_ALL_PERKS_KEY = 'highlightAllPerks';
  private static WISHLIST_OVERRIDE_PVE_URL_KEY = 'wishlistOverridePveUrl';
  private static WISHLIST_OVERRIDE_PVP_URL_KEY = 'wishlistOverridePvpUrl';
  public wishlistOverridePveUrl;
  public wishlistOverridePvpUrl;


  public highlightAllPerks = true;

  private filterChangedSubject: Subject<void> = new Subject<void>();
  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
  public _player: BehaviorSubject<Player> = new BehaviorSubject(null);
  public filterKeyUp: Subject<void> = new Subject();
  visibleFilterText = null;

  @ViewChild('filter', { static: false })
  filter: ElementRef;

  filterTags: string[] = [];
  orMode = false;
  appendMode = false;

  options = [
    { name: 'Weapons', type: ItemType.Weapon, path: 'weapons' },
    { name: 'Armor', type: ItemType.Armor, path: 'armor' },
    { name: 'Ghosts', type: ItemType.Ghost, path: 'ghosts' },
    { name: 'Vehicles', type: ItemType.Vehicle, path: 'vehicles' },
    { name: 'Mods', type: ItemType.GearMod, path: 'mods' },
    { name: 'Consumable', type: ItemType.Consumable, path: 'consumable' },
    { name: 'Material', type: ItemType.ExchangeMaterial, path: 'material' }];
  option = this.options[0];
  sortBy = 'power';
  sortDesc = true;
  gearToShow: InventoryItem[] = [];
  page = 0;
  size = 20;
  total = 0;

  ItemType = ItemType;
  DamageType = DamageType;
  EnergyType = EnergyType;
  ClassAllowed = ClassAllowed;

  show(count: number) {
    this.size = count;
    this.filterChanged();
  }

  trackGearItem(index, item) {
    return item ? item.id : undefined;

  }

  tabChanged(): void {
    this.router.navigate(['gear', this.optionsgroup.value.path]);
  }

  filterChanged(): void {
    this.filtering.next(true);
    this.filterChangedSubject.next();
  }

  resetFilters(): void {
    if (this.filter) {
      this.filter.nativeElement.value = '';
    }
    this.visibleFilterText = null;
    this.filterTags = [];
    this.orMode = false;
    this.appendMode = false;
    const filters = this.grabFilters();
    for (const toggle of filters) {
      toggle.selectAll(true);
    }
    this.filterChanged();

  }

  showPossibleRolls(i: InventoryItem) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    // dc.autoFocus = true;
    // dc.width = '1000px';
    dc.data = {
      parent: this,
      item: i
    };
    this.dialog.open(PossibleRollsDialogComponent, dc);

  }

  copyToClipboard(i: InventoryItem) {
    const markdown = this.toMarkDown(i);
    this.clipboardService.copyFromContent(markdown);
    this.notificationService.success('Copied ' + i.name + ' to clipboard');
  }

  copyAllVisibleToClipboard() {
    let markdown = '';
    let cntr = 0;
    if (this.gearToShow.length == 1) {
      markdown += this.toMarkDown(this.gearToShow[0]);
    } else {
      for (const i of this.gearToShow) {
        cntr++;
        markdown += this.toMarkDown(i, cntr);
        markdown += '\n\n';
      }
    }
    this.clipboardService.copyFromContent(markdown);
    this.notificationService.success('Copied ' + this.gearToShow.length + ' items to clipboard');
  }

  async moveAllVisible(target: Target) {
    await this.gearService.bulkMove(this._player.getValue(), this.gearToShow, target);
    await this.load(true);
  }

  private toMarkDown(i: InventoryItem, cntr?: number): string {
    let markdown = '';
    if (cntr == null) {
      markdown = '**' + i.name + '**\n\n';
    } else {
      markdown = '**' + cntr + '. ' + i.name + '**\n\n';
    }

    for (const socket of i.sockets) {
      markdown += '\n\n* ';
      for (const plug of socket.plugs) {
        markdown += plug.name;
        if (plug !== socket.plugs[socket.plugs.length - 1]) {
          markdown += ' / ';
        }
      }
    }
    markdown += '\n\n';
    if (i.masterwork != null) {
      markdown += '\n\n* *Masterwork: ' + i.masterwork.name + ' ' + i.masterwork.tier + '*';
    }
    for (const mod of i.mods) {
      markdown += '\n\n* *Mod: ' + mod.name + '*';
    }
    return markdown;
  }

  constructor(storageService: StorageService,
    private bungieService: BungieService,
    private cacheService: DestinyCacheService,
    public iconService: IconService,
    public markService: MarkService,
    public gearService: GearService,
    private wishlistService: WishlistService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private targetPerkService: TargetPerkService,
    public preferredStatService: PreferredStatService,
    private route: ActivatedRoute,
    public router: Router,
    private location: Location,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.loading.next(true);

    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const sTab = params.tab;
      if (sTab) {
        for (const o of this.options) {
          if (o.path == sTab) {
            this.option = o;
          }
        }
      }
      this.filterChanged();
    });

    if (localStorage.getItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY) == 'false') {
      this.highlightAllPerks = false;
    }

    const wishlistOverridePveUrl = localStorage.getItem(GearComponent.WISHLIST_OVERRIDE_PVE_URL_KEY);
    if (wishlistOverridePveUrl != null) {
      this.wishlistOverridePveUrl = wishlistOverridePveUrl;
    }

    const wishlistOverridePvpUrl = localStorage.getItem(GearComponent.WISHLIST_OVERRIDE_PVP_URL_KEY);
    if (wishlistOverridePvpUrl != null) {
      this.wishlistOverridePvpUrl = wishlistOverridePvpUrl;
    }
    this.targetPerkService.perks.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(x => {
        if (this._player.getValue() != null) {
          this.targetPerkService.processGear(this._player.getValue());
          this.load();
        }
      });
    this.preferredStatService.stats.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(x => {
        if (this._player.getValue() != null) {
          this.preferredStatService.processGear(this._player.getValue());
          this.load();
        }
      });
  }

  public updateHighlightAllPerks() {
    if (this.highlightAllPerks == false) {
      localStorage.setItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY, 'false');
    } else {
      localStorage.removeItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY);
    }
  }



  public async updateWishlistOverrideUrl(newPveVal: string, newPvpVal: string) {
    // just reload the page if this works, easier then worrying about it
    if (newPveVal == null) {
      localStorage.removeItem(GearComponent.WISHLIST_OVERRIDE_PVE_URL_KEY);
    }
    if (newPvpVal == null) {
      localStorage.removeItem(GearComponent.WISHLIST_OVERRIDE_PVP_URL_KEY);
    }
    if (newPveVal == null && newPvpVal == null) {
      window.location.reload();
      return;
    }
    let reloadMe = false;
    if (newPveVal != this.wishlistOverridePveUrl) {
      const tempRolls = await this.wishlistService.loadSingle('testPve', newPveVal, null);
      if (tempRolls.length > 0) {
        localStorage.setItem(GearComponent.WISHLIST_OVERRIDE_PVE_URL_KEY, newPveVal);
        reloadMe = true;
      }
    }
    if (newPvpVal != this.wishlistOverridePvpUrl) {
      const tempRolls = await this.wishlistService.loadSingle('testPvp', newPvpVal, null);
      if (tempRolls.length > 0) {
        localStorage.setItem(GearComponent.WISHLIST_OVERRIDE_PVP_URL_KEY, newPvpVal);
        reloadMe = true;
      }
    }
    if (reloadMe) {
      window.location.reload();
    }
  }

  public async syncLocks() {
    await this.load();
    await this.gearService.processGearLocks(this._player.getValue());
    this.filterChanged();
  }

  public async pullFromPostmaster(player: Player, itm: InventoryItem) {
    try {
      const owner = itm.owner.getValue();
      await this.gearService.transfer(player, itm, owner);
      this.notificationService.success('Pulled ' + itm.name + ' from postmaster to ' + owner.label);
    } catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async transfer(player: Player, itm: InventoryItem, target: Target) {
    try {
      await this.gearService.transfer(player, itm, target);
      this.notificationService.success('Transferred ' + itm.name + ' to ' + target.label);
    } catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async equip(player: Player, itm: InventoryItem) {
    await this.gearService.equip(player, itm);
    this.notificationService.success('Equipped ' + itm.name + ' on ' + itm.owner.getValue().label);
    this.filterChanged();
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  markCurrentRows(marking: string) {
    const items = this.gearToShow;
    for (const item of this.gearToShow) {
      item.mark = marking;
      this.markService.updateItem(item);
    }
    this.filterChanged();
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) { marking = null; }
    item.mark = marking;
    this.markService.updateItem(item);
    this.filterChanged();
  }

  showCopies(i: InventoryItem) {
    const copies = this.gearService.findCopies(i, this._player.getValue());
    this.openGearDialog(i, copies, false);
  }

  showSimilarBySeason(i: InventoryItem) {
    const copies = this.gearService.findSimilar(i, this._player.getValue(), true);
    this.openGearDialog(i, copies, true);
  }

  showSimilarBySeasonAndBurn(i: InventoryItem) {
    const copies = this.gearService.findSimilar(i, this._player.getValue(), true, true);
    this.openGearDialog(i, copies, true);
  }

  showSimilar(i: InventoryItem, season?: boolean) {
    const copies = this.gearService.findSimilar(i, this._player.getValue());
    this.openGearDialog(i, copies, true);
  }


  showItem(i: InventoryItem) {
    this.openGearDialog(i, [i], false);
  }

  sort(val: string) {
    if (val == this.sortBy) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortBy = val;
      this.sortDesc = true;
    }
    this.filterChanged();
  }

  private static _processComparison(prefix: string, tagVal: string, gearVal: number): boolean {
    if (!tagVal.startsWith(prefix)) {
      return null;
    }
    let val = tagVal.substr(prefix.length);
    let comp: NumComparison = null;
    if (val.startsWith('<=')) {
      val = val.substr(2);
      comp = NumComparison.lte;
    } else if (val.startsWith('>=')) {
      val = val.substr(2);
      comp = NumComparison.gte;
    } else if (val.startsWith('<')) {
      val = val.substr(1);
      comp = NumComparison.lt;
    } else if (val.startsWith('>')) {
      val = val.substr(1);
      comp = NumComparison.gt;
    } else if (val.startsWith('=')) {
      val = val.substr(1);
      comp = NumComparison.e;
    } else {
      return null;
    }
    if (!GearComponent.NUMBER_REGEX.test(val)) {
      return null;
    }
    const iVal = +val;
    switch (comp) {
      case NumComparison.gte: {
        return gearVal >= iVal;
      }
      case NumComparison.lte: {
        return gearVal <= iVal;
      }
      case NumComparison.gt: {
        return gearVal > iVal;
      }
      case NumComparison.lt: {
        return gearVal < iVal;
      }
      case NumComparison.e: {
        return gearVal == iVal;
      }
      default: {
        return null;
      }
    }
  }

  public async setLock(player: Player, itm: InventoryItem, locked: boolean) {
    await this.gearService.setLock(player, itm, locked);
    this.filterChanged();
  }


  private static _processFilterTag(actual: string, i: InventoryItem): boolean {
    if (actual == 'is:locked') {
      return i.locked.getValue();
    }
    if (actual == 'is:unlocked') {
      return !i.locked.getValue();
    }
    let compResult = GearComponent._processComparison('is:light', actual, i.power);
    if (compResult != null) {
      return compResult;
    }
    compResult = GearComponent._processComparison('is:stattotal', actual, i.totalStatPoints);
    if (compResult != null) {
      return compResult;
    }
    if (i.searchText.indexOf(actual) >= 0) {
      return true;
    }
    if (i.notes != null && i.notes.toLowerCase().indexOf(actual) >= 0) { return true; }
    return false;
  }

  private static processFilterTag(f: string, i: InventoryItem): boolean {
    if (f.startsWith('!')) {
      const actual = f.substr(1);
      return !this._processFilterTag(actual, i);
    } else {
      return this._processFilterTag(f, i);
    }
  }

  shouldKeepItem(i: InventoryItem): boolean {
    for (const f of this.filterTags) {
      const match = GearComponent.processFilterTag(f, i);
      if (!this.orMode && !match) {
        return false;
      } else if (this.orMode && match) {
        return true;
      }
    }
    if (this.orMode) {
      return false;
    } else {
      return true;
    }
  }

  private wildcardFilter(gear: InventoryItem[]): InventoryItem[] {
    if (this.filterTags.length > 0) {
      for (const f of this.filterTags) {
        this.filterNotes.push('wildcard = ' + f);
      }
      return gear.filter(this.shouldKeepItem, this);
    } else {
      return gear;
    }
  }

  checkFilterDirty() {
    if (this.filterTags.length > 0) { return true; }
    const filters = this.grabFilters();
    for (const toggle of filters) {
      if (!toggle.isAllSelected) { return true; }
    }
    return false;
  }

  private appendToggleFilterNote(t: GearToggleComponent) {
    if (t == null) { return; }
    const note = t.getNotes();
    if (note != null) {
      this.filterNotes.push(note);
    }
  }

  private appendToggleFilterNotes() {
    this.appendToggleFilterNote(this.markToggle);
    this.appendToggleFilterNote(this.weaponTypeToggle);
    this.appendToggleFilterNote(this.ammoTypeToggle);
    this.appendToggleFilterNote(this.armorInventoryBucketToggle);
    this.appendToggleFilterNote(this.weaponInventoryBucketToggle);
    this.appendToggleFilterNote(this.energyTypeToggle);
    this.appendToggleFilterNote(this.damageTypeToggle);
    this.appendToggleFilterNote(this.vehicleTypeToggle);
    this.appendToggleFilterNote(this.modTypeToggle);
    this.appendToggleFilterNote(this.consumableTypeToggle);
    this.appendToggleFilterNote(this.exchangeTypeToggle);
    this.appendToggleFilterNote(this.ownerToggle);
    this.appendToggleFilterNote(this.equippedToggle);
    this.appendToggleFilterNote(this.rarityToggle);
    this.appendToggleFilterNote(this.classTypeToggle);
  }

  private toggleFilterSingle(i: InventoryItem, report: any): boolean {

    if (!this.markToggle.isChosen(this.option.type, i.mark)) {
      const key = 'mark';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.weaponTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'weaponType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.ammoTypeToggle.isChosen(this.option.type, i.ammoType)) {
      const key = 'ammoType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.armorInventoryBucketToggle.isChosen(this.option.type, i.inventoryBucket.displayProperties.name)) {
      const key = 'armorInventoryBucket';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.damageTypeToggle.isChosen(this.option.type, i.damageType)) {
      const key = 'damageType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.energyTypeToggle.isChosen(this.option.type, i.energyType)) {
      const key = 'energyType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.weaponInventoryBucketToggle.isChosen(this.option.type, i.inventoryBucket.displayProperties.name)) {
      const key = 'weaponInventoryBucket';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.vehicleTypeToggle.isChosen(this.option.type, i.inventoryBucket.displayProperties.name)) {
      const key = 'vehicleType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.modTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'modType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.consumableTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'consumableType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.exchangeTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'exchangeType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.ownerToggle.isChosen(this.option.type, i.owner.getValue().id)) {
      const key = 'owner';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.equippedToggle.isChosen(this.option.type, '' + i.equipped.getValue())) {
      const key = 'equipped';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.rarityToggle.isChosen(this.option.type, i.tier)) {
      const key = 'rarity';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.classTypeToggle.isChosen(this.option.type, i.classAllowed)) {
      const key = 'classType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    return true;
  }

  private toggleFilter(gear: InventoryItem[]): InventoryItem[] {
    // hit it with a hammer, owner and rarity are fine
    this.markToggle.setCurrentItemType(this.option.type);
    this.weaponTypeToggle.setCurrentItemType(this.option.type);
    this.ammoTypeToggle.setCurrentItemType(this.option.type);
    this.armorInventoryBucketToggle.setCurrentItemType(this.option.type);
    this.weaponInventoryBucketToggle.setCurrentItemType(this.option.type);
    this.energyTypeToggle.setCurrentItemType(this.option.type);
    this.damageTypeToggle.setCurrentItemType(this.option.type);
    this.vehicleTypeToggle.setCurrentItemType(this.option.type);
    this.modTypeToggle.setCurrentItemType(this.option.type);
    this.consumableTypeToggle.setCurrentItemType(this.option.type);
    this.exchangeTypeToggle.setCurrentItemType(this.option.type);
    this.ownerToggle.setCurrentItemType(this.option.type);
    this.equippedToggle.setCurrentItemType(this.option.type);
    this.rarityToggle.setCurrentItemType(this.option.type);
    this.classTypeToggle.setCurrentItemType(this.option.type);


    this.appendToggleFilterNotes();
    const returnMe: InventoryItem[] = [];
    const report: any = {};
    for (const i of gear) {
      if (this.toggleFilterSingle(i, report)) {
        returnMe.push(i);
      }
    }

    return returnMe;
  }



  filterGear() {
    this.filterNotes = [];
    if (this._player.getValue() == null) { return; }
    let tempGear = this._player.getValue().gear.filter(i => i.type == this.option.type);
    tempGear = this.wildcardFilter(tempGear);
    tempGear = this.toggleFilter(tempGear);
    GearService.sortGear(this.sortBy, this.sortDesc, tempGear);
    const start = this.page * this.size;
    const end = Math.min(start + this.size, tempGear.length);
    if (start >= end) {
      this.page = 0;
      this.gearToShow = tempGear.slice(0, this.size);
    } else {

      this.gearToShow = tempGear.slice(start, end);
    }
    this.total = tempGear.length;
  }

  public async shardMode(weaponsOnly?: boolean) {
    await this.load(true);
    await this.gearService.shardMode(this._player.getValue(), weaponsOnly);
    await this.load(true);
    await this.syncLocks();
  }

  public async clearInv(weaponsOnly?: boolean) {
    await this.load(true);
    await this.gearService.clearInv(this._player.getValue(), weaponsOnly);
  }

  public async upgradeMode(weaponsOnly?: boolean) {
    await this.load(true);
    await this.gearService.upgradeMode(this._player.getValue(), weaponsOnly);
    await this.load(true);
    await this.syncLocks();
  }

  public async load(quiet?: boolean) {
    this.loading.next(true);

    if (quiet != true) {
      this.notificationService.info('Loading gear...');
    }
    try {
      if (this.selectedUser == null) {
        this._player.next(null);
      } else {
        const p = await this.gearService.loadGear(this.selectedUser);
        this._player.next(p);
      }
      this.generateChoices();
      this.filterChanged();
    }
    finally {
      this.loading.next(false);
    }
  }

  private static sortByIndexReverse(a: any, b: any): number {
    if (a.index < b.index) {
      return 1;
    } if (a.index > b.index) {
      return -1;
    }
    return 0;
  }

  private static sortByIndex(a: any, b: any): number {
    if (a.index < b.index) {
      return -1;
    } if (a.index > b.index) {
      return 1;
    }
    return 0;
  }

  private generateDamageTypeChoices(): Choice[] {
    const returnMe: Choice[] = [];
    returnMe.push(new Choice('' + DamageType.Kinetic, 'Kinetic'));
    returnMe.push(new Choice('' + DamageType.Arc, 'Arc'));
    returnMe.push(new Choice('' + DamageType.Thermal, 'Solar'));
    returnMe.push(new Choice('' + DamageType.Void, 'Void'));
    return returnMe;
  }

  private generateEnergyTypeChoices(): Choice[] {
    const returnMe: Choice[] = [];
    returnMe.push(new Choice('' + EnergyType.Arc, 'Arc'));
    returnMe.push(new Choice('' + EnergyType.Thermal, 'Solar'));
    returnMe.push(new Choice('' + EnergyType.Void, 'Void'));
    returnMe.push(new Choice('' + EnergyType.Any, 'Any'));
    return returnMe;
  }



  private generateRarityChoices(): Choice[] {
    const tiers = this.cacheService.cache['ItemTierType'];
    const aTiers: ApiItemTierType[] = [];
    for (const key of Object.keys(tiers)) {
      const val: ApiItemTierType = tiers[key];
      if (!val.blacklisted && !val.redacted) {
        if (val.displayProperties.name != 'Basic') {
          aTiers.push(val);
        }
      }
    }
    aTiers.sort(GearComponent.sortByIndexReverse);
    const returnMe: Choice[] = [];
    for (const tier of aTiers) {
      returnMe.push(new Choice(tier.displayProperties.name, tier.displayProperties.name));
    }
    return returnMe;
  }

  private generateBucketChoices(itemType: ItemType): Choice[] {
    const buckets = this.cacheService.cache['InventoryBucket'];
    const aBuckets: ApiInventoryBucket[] = [];
    for (const key of Object.keys(buckets)) {
      const val: ApiInventoryBucket = buckets[key];
      if (!val.blacklisted && !val.redacted && val.category == 3) {
        if (itemType === ItemType.Weapon) {
          if (val.index <= 2) {
            aBuckets.push(val);
          }
        } else if (itemType === ItemType.Armor) {

          if (val.index >= 3 && val.index <= 7) {
            aBuckets.push(val);
          }
        } else if (itemType === ItemType.Vehicle) {

          if (val.index >= 9 && val.index <= 10) {
            aBuckets.push(val);
          }
        }

      }
    }
    aBuckets.sort(GearComponent.sortByIndex);
    const returnMe: Choice[] = [];

    for (const bucket of aBuckets) {
      returnMe.push(new Choice(bucket.displayProperties.name, bucket.displayProperties.name));
    }
    return returnMe;
  }


  // TODO use inventorybucket to generate other type choices properly

  private generateChoices(force?: boolean) {
    if (this._player.getValue() == null) { return; }
    if (this._player.getValue().gear == null) { return; }
    if (this._player.getValue().gear.length == 0) { return; }
    if (this.weaponTypeChoices.length > 0 && !force) { return; }

    const tempOwners = [];
    for (const char of this._player.getValue().characters) {
      tempOwners.push(new Choice(char.id, char.label));
    }
    tempOwners.push(new Choice(this._player.getValue().vault.id, this._player.getValue().vault.label));
    tempOwners.push(new Choice(this._player.getValue().shared.id, this._player.getValue().shared.label));
    this.ownerChoices = tempOwners;

    const temp: any = {};
    // for each piece of gear, grab a set of its type names, by type
    // and grab the superset of rarity tiers
    for (const i of this._player.getValue().gear) {
      if (temp[i.type + ''] == null) {
        temp[i.type + ''] = [];
        temp[i.type + 'bucket'] = [];
      }
      temp[i.type + ''][i.typeName] = true;
      temp[i.type + 'bucket'][i.inventoryBucket.displayProperties.name] = true;

    }
    const arrays: any = {};
    for (const key of Object.keys(temp)) {
      const arr = [];
      for (const typeName of Object.keys(temp[key])) {
        arr.push(new Choice(typeName, typeName));
      }
      arr.sort(function (a, b) {
        if (a.display < b.display) {
          return -1;
        }
        if (a.display > b.display) {
          return 1;
        }
        return 0;
      });
      arrays[key] = arr;
    }
    this.weaponTypeChoices = arrays[ItemType.Weapon + ''];
    this.weaponInventoryBucketChoices = this.generateBucketChoices(ItemType.Weapon);
    this.damageTypeChoices = this.generateDamageTypeChoices();
    this.energyTypeChoices = this.generateEnergyTypeChoices();
    this.armorInventoryBucketChoices = this.generateBucketChoices(ItemType.Armor);
    this.vehicleTypeChoices = this.generateBucketChoices(ItemType.Vehicle);
    this.modTypeChoices = arrays[ItemType.GearMod + ''];
    this.consumableTypeChoices = arrays[ItemType.Consumable + ''];
    this.exchangeTypeChoices = arrays[ItemType.ExchangeMaterial + ''];
    this.rarityChoices = this.generateRarityChoices();
  }

  async loadMarks() {
    if (this.selectedUser) {
      await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
        this.selectedUser.userInfo.membershipId);
      if (this._player.getValue() != null) {
        this.markService.processItems(this._player.getValue().gear);
      }
    }
  }

  async loadWishlist() {
    await this.wishlistService.init(this.wishlistOverridePveUrl, this.wishlistOverridePvpUrl);
    if (this._player.getValue() != null) {
      this.wishlistService.processItems(this._player.getValue().gear);
    }
    this.filterChanged();
  }

  parseWildcardFilter() {
    const val: string = this.visibleFilterText;
    if (val == null || val.trim().length == 0) {
      localStorage.removeItem('gear-filter');
    } else {
      localStorage.setItem('gear-filter', val);
    }
    if (val == null || val.trim().length === 0) {
      this.filteredAutoCompleteOptions.next([]);
      this.filterTags = [];
      this.orMode = false;
      this.appendMode = false;
    } else {
      const rawFilter = val.toLowerCase();
      if (rawFilter.indexOf(' or ') >= 0) {
        this.filterTags = rawFilter.split(' or ');
        this.orMode = true;
      } else {
        this.orMode = false;
        this.filterTags = rawFilter.split(' and ');
      }
      this.appendMode = rawFilter.endsWith(' and ') || rawFilter.endsWith(' or ');
      const newFilteredOptions = [];
      if (rawFilter.startsWith('is:')||rawFilter.startsWith('sea')) {
        for (const o of this.autocompleteOptions) {
          if (o.startsWith(rawFilter)) {
            newFilteredOptions.push(o);
          }
        }
      }
      this.filteredAutoCompleteOptions.next(newFilteredOptions);
    }
    this.filterChanged();
  }

  public autoCompleteSelected(event: MatAutocompleteSelectedEvent) {
    this.parseWildcardFilter();
    // console.dir(event);
  }

  public handlePage(x: PageEvent) {
    this.page = x.pageIndex;
    this.size = x.pageSize;
    this.filterChanged();
  }

  private grabFilters(): GearToggleComponent[] {
    const filters = [];
    if (this.markToggle) { filters.push(this.markToggle); }
    if (this.weaponTypeToggle) { filters.push(this.weaponTypeToggle); }
    if (this.ammoTypeToggle) { filters.push(this.ammoTypeToggle); }
    if (this.armorInventoryBucketToggle) { filters.push(this.armorInventoryBucketToggle); }
    if (this.weaponInventoryBucketToggle) { filters.push(this.weaponInventoryBucketToggle); }
    if (this.energyTypeToggle) { filters.push(this.energyTypeToggle); }
    if (this.damageTypeToggle) { filters.push(this.damageTypeToggle); }

    if (this.vehicleTypeToggle) { filters.push(this.vehicleTypeToggle); }
    if (this.modTypeToggle) { filters.push(this.modTypeToggle); }
    if (this.consumableTypeToggle) { filters.push(this.consumableTypeToggle); }
    if (this.exchangeTypeToggle) { filters.push(this.exchangeTypeToggle); }
    if (this.ownerToggle) { filters.push(this.ownerToggle); }
    if (this.equippedToggle) { filters.push(this.equippedToggle); }
    if (this.rarityToggle) { filters.push(this.rarityToggle); }
    if (this.classTypeToggle) { filters.push(this.classTypeToggle); }
    return filters;
  }

  ngAfterViewInit() {
    this.filterChangedSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filtersDirty = this.checkFilterDirty();
        try {
          if (this.optionsgroup) {
            this.option = this.optionsgroup.value;
            this.filterGear();
          }

        } catch (e) {
          console.log('Error filtering: ' + e);
        }
        this.filtering.next(false);
        this.ref.markForCheck();
      });


    this.noteChanged.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(itm => {
        this.markService.updateItem(itm);
      });


    const gFilter = localStorage.getItem('gear-filter');
    if (gFilter != null) {
      this.visibleFilterText = gFilter;
    }
    this.parseWildcardFilter();
    this.filterKeyUp.pipe(takeUntil(this.unsubscribe$),
      debounceTime(150))
      .subscribe(() => {
        this.parseWildcardFilter();
      });
  }

  public showArmorPerks(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    this.dialog.open(ArmorPerksDialogComponent, dc);
  }

  public showTargetArmorPerks(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    this.dialog.open(TargetArmorPerksDialogComponent, dc);
  }

  public showTargetArmorStats(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    this.dialog.open(TargetArmorStatsDialogComponent, dc);
  }


  public showUtilities(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    this.dialog.open(GearUtilitiesDialogComponent, dc);
  }

  public openGearDialog(source: InventoryItem, items: InventoryItem[], showNames: boolean): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    // dc.autoFocus = true;
    // dc.width = '500px';
    dc.data = {
      parent: this,
      source,
      items: items,
      showNames: showNames
    };
    this.dialog.open(GearCompareDialogComponent, dc);
  }



  public showWildcardHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;

    dc.data = {
    };
    this.dialog.open(GearHelpDialogComponent, dc);
  }

  public showBulkOperationHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
    };
    this.dialog.open(BulkOperationsHelpDialogComponent, dc);
  }

  ngOnInit() {
    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.loadMarks();
      this.load(true);
    });
    this.loadWishlist();

  }
}
