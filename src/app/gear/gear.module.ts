import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClipboardModule } from 'ngx-clipboard';
import { GearComponent, GearDetailsDialogComponent, GearHelpDialogComponent, BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent, ArmorPerksDialogComponent } from './gear/gear.component';
import { GearToggleComponent} from './gear/gear-toggle.component';
import { TargetArmorPerksDialogComponent } from './target-armor-perks-dialog/target-armor-perks-dialog.component';
import { GodRollPlugComponent } from './god-roll-plug/god-roll-plug.component';
import { GodRollItemComponent } from './god-roll-item/god-roll-item.component';
import { PossibleRollsDialogComponent } from './possible-rolls-dialog/possible-rolls-dialog.component';
import { TargetArmorStatsDialogComponent } from './target-armor-stats-dialog/target-armor-stats-dialog.component';

@NgModule({
  imports: [
    SharedModule, ClipboardModule
  ],
  declarations: [GearComponent, GearToggleComponent, GearDetailsDialogComponent, GearHelpDialogComponent, BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent,
    ArmorPerksDialogComponent, TargetArmorPerksDialogComponent, TargetArmorStatsDialogComponent, GodRollPlugComponent, GodRollItemComponent, PossibleRollsDialogComponent, TargetArmorStatsDialogComponent],
  entryComponents: [
    PossibleRollsDialogComponent,
    GearDetailsDialogComponent, GearHelpDialogComponent,
    BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent,
    ArmorPerksDialogComponent, TargetArmorPerksDialogComponent, TargetArmorStatsDialogComponent
  ],
})
export class GearModule  { }
