import type { AssetCategory } from '../types';

export interface DiagnosticStep {
  id: string;
  title: string;
  instruction: string;
  checkQuestion: string;
  safetyNote?: string;
  proWarning?: boolean;
  yesOutcome: string;
  noNextHint: string;
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  category: AssetCategory;
  summary: string;
  riskLevel: 'Low' | 'Moderate' | 'High Safety Risk';
  estimatedTime: string;
  preCheckSafetyBanner: string;
  requiresProfessionalImmediately?: boolean;
  stopAndCallProSigns: string[];
  steps: DiagnosticStep[];
  preventiveTip: string;
}

export const COPILOT_GUIDES: TroubleshootingGuide[] = [
  {
    id: 'ac-not-cooling',
    title: 'AC not cooling',
    category: 'Air conditioner',
    summary:
      'Step-by-step airflow, thermostat, filter, and outdoor unit checks for split and central air conditioners.',
    riskLevel: 'Moderate',
    estimatedTime: '10–15 min',
    preCheckSafetyBanner:
      'Always switch off the AC at the wall isolator or breaker before removing filter panels or cleaning around the outdoor unit. Never open refrigerant lines or electrical capacitor housings yourself.',
    stopAndCallProSigns: [
      'Ice buildup on copper refrigerant pipes or indoor evaporator coils',
      'Burning electrical odor or breaker tripping immediately upon startup',
      'Outdoor compressor clicking repeatedly without running',
      'Hissing sound indicating a pressurized refrigerant leak',
    ],
    steps: [
      {
        id: 'ac-1',
        title: 'Verify thermostat mode & setpoint',
        instruction:
          'Confirm the remote or wall thermostat is set to COOL (snowflake icon), not FAN or DRY, and set at least 3°C (5°F) below current room temperature. Replace weak remote batteries if the display is dim.',
        checkQuestion: 'Did switching to COOL mode restore cold airflow after 5 minutes?',
        yesOutcome:
          'Issue resolved. Thermostat mode or temperature offset prevented the compressor from engaging.',
        noNextHint: 'Next, inspect airflow and indoor mesh filters.',
      },
      {
        id: 'ac-2',
        title: 'Inspect and clean indoor air filters',
        instruction:
          'Power off the AC unit. Lift the front intake cover and slide out the mesh air filters. Hold them up to light—if clogged with dust, rinse gently with lukewarm water, let them air-dry completely, and reinstall.',
        checkQuestion: 'Is airflow noticeably stronger and cooler after cleaning the filters?',
        yesOutcome:
          'Issue resolved. Clogged filters restrict evaporator airflow and cause poor cooling.',
        noNextHint: 'Next, check outdoor condenser clearance and fan operation.',
      },
      {
        id: 'ac-3',
        title: 'Check outdoor condenser unit clearance',
        instruction:
          'Visually inspect the outdoor unit from a safe distance. Ensure at least 60 cm (2 ft) of open clearance around the fins and remove leaves or debris blocking airflow. Observe whether the outdoor fan spins when the AC is turned on.',
        safetyNote:
          'Never insert tools or fingers through the fan grille while powered.',
        checkQuestion:
          'Was debris blocking the outdoor unit and did clearing it restore cooling?',
        yesOutcome:
          'Issue resolved. Heat rejection at the condenser was obstructed.',
        noNextHint: 'Next, check for frozen coils or breaker trips.',
      },
      {
        id: 'ac-4',
        title: 'Inspect for frost, condensate block, or compressor fault',
        instruction:
          'Check if frost or ice is visible on the indoor coils or insulated outdoor copper pipe. If ice is present, switch the unit to FAN-only mode for 2 hours to thaw. If the outdoor fan runs but air stays room-temperature, the unit likely has low refrigerant or a failing start capacitor.',
        safetyNote:
          'Refrigerant handling and high-voltage capacitor replacement must only be performed by a certified HVAC technician.',
        proWarning: true,
        checkQuestion: 'Did thawing and restarting restore normal cooling?',
        yesOutcome:
          'Temporary freeze cleared. Schedule an HVAC inspection soon to check refrigerant charge.',
        noNextHint:
          'Stop DIY troubleshooting and book a certified HVAC technician.',
      },
    ],
    preventiveTip:
      'Clean indoor mesh filters every 60–90 days and book an annual coil & drain flush before peak summer.',
  },
  {
    id: 'fridge-not-cooling',
    title: 'Refrigerator not cooling',
    category: 'Refrigerator',
    summary:
      'Diagnose temperature settings, door gasket leaks, airflow vents, and dusty condenser coils safely.',
    riskLevel: 'Low',
    estimatedTime: '10–15 min',
    preCheckSafetyBanner:
      'Unplug the refrigerator from the wall outlet before vacuuming rear or bottom condenser coils. Keep food doors closed as much as possible to preserve cold air.',
    stopAndCallProSigns: [
      'Heavy frost sheet behind the freezer back panel returning repeatedly',
      'Compressor feels scalding hot or makes loud metallic knocking noises',
      'Chemical odor inside the compartment (possible refrigerant leak)',
      'Power cord damage or GFCI outlet tripping repeatedly',
    ],
    steps: [
      {
        id: 'fr-1',
        title: 'Confirm temperature controls & Demo Mode',
        instruction:
          'Check the display panel to ensure the fridge is not accidentally in Showroom/Demo or Vacation mode. Set fresh food compartment to 3°C–4°C (37°F–40°F) and freezer to -18°C (0°F).',
        checkQuestion: 'Were settings off or in Demo mode, and is cooling resuming?',
        yesOutcome:
          'Issue resolved. Allow 6–12 hours for internal temperatures to stabilize.',
        noNextHint: 'Next, check internal air vents and door seals.',
      },
      {
        id: 'fr-2',
        title: 'Clear internal vents and test door gaskets',
        instruction:
          'Ensure tall containers or grocery bags are not blocking the cold-air supply vents at the back wall. Perform the paper test: close a sheet of paper in the door gasket and pull gently—if it slides out with zero resistance, clean the magnetic seal with warm soapy water.',
        checkQuestion:
          'Did unblocking vents or cleaning a sticky door seal restore steady cooling?',
        yesOutcome:
          'Issue resolved. Warm ambient air intrusion or blocked vents caused warm spots.',
        noNextHint: 'Next, inspect the condenser coils for dust buildup.',
      },
      {
        id: 'fr-3',
        title: 'Clean condenser coils & verify wall clearance',
        instruction:
          'Unplug the refrigerator. Gently pull it forward and vacuum dust and pet hair from the rear or bottom condenser grille using a soft brush attachment. Leave at least 5 cm (2 inches) of ventilation space behind the unit when pushing it back.',
        safetyNote: 'Do not bend thin copper tubing or pinch the water supply line.',
        checkQuestion:
          'After cleaning heavily dusty coils and reconnecting power, does the fridge cool normally?',
        yesOutcome:
          'Issue resolved. Dust-insulated coils were preventing heat dissipation.',
        noNextHint:
          'If the compressor or evaporator fan still fails to cool, book an appliance technician.',
      },
    ],
    preventiveTip:
      'Vacuum condenser coils twice a year and avoid packing food directly against rear air dampers.',
  },
  {
    id: 'washer-not-draining',
    title: 'Washing machine not draining',
    category: 'Washing machine',
    summary:
      'Safely clear coin traps, check kinked drain hoses, and reset spin cycles for front-load and top-load washers.',
    riskLevel: 'Low',
    estimatedTime: '15–20 min',
    preCheckSafetyBanner:
      'Unplug the washing machine before opening the lower drain pump filter panel. Place shallow trays and thick towels underneath—standing water inside the drum can be hot.',
    stopAndCallProSigns: [
      'Water leaking underneath the motor housing or electrical control board',
      'Loud grinding noise from the pump even after clearing debris',
      'Circuit breaker trips whenever the drain pump activates',
    ],
    steps: [
      {
        id: 'wm-1',
        title: 'Run a Drain & Spin reset and inspect load balance',
        instruction:
          'If a heavy blanket or rug bunched on one side, some washers pause draining for safety. Redistribute wet laundry evenly, close the door firmly until it latches, and run a standalone "Drain & Spin" cycle.',
        checkQuestion: 'Did the machine drain the standing water normally?',
        yesOutcome:
          'Issue resolved. An unbalanced load or loose door latch paused the cycle.',
        noNextHint: 'Next, inspect the rear drain hose for kinks or clogs.',
      },
      {
        id: 'wm-2',
        title: 'Check the drain hose height & kinks',
        instruction:
          'Unplug the washer and check the corrugated drain hose at the rear. Straighten any pinched bends and verify the standpipe end is not pushed too deep into the drain (it should sit 10–15 cm inside with an air gap).',
        checkQuestion: 'Was the hose kinked or jammed, and does it drain now?',
        yesOutcome: 'Issue resolved. Restored unobstructed discharge flow.',
        noNextHint: 'Next, carefully drain and clean the front coin-trap filter.',
      },
      {
        id: 'wm-3',
        title: 'Clean the drain pump coin-trap filter',
        instruction:
          'Place towels and a shallow pan under the bottom-front service hatch. Use the small emergency drain tube (if equipped) to empty water first, then unscrew the filter cap counterclockwise. Remove coins, hairpins, or lint and check that the small impeller behind it turns freely by hand.',
        safetyNote:
          'Ensure the washer is completely unplugged before touching the pump cavity.',
        checkQuestion:
          'Did clearing debris from the pump filter resolve the drainage issue?',
        yesOutcome:
          'Issue resolved. Re-tighten the filter cap snugly and run a short rinse to check for leaks.',
        noNextHint:
          'If the filter is clean and the pump still does not run, schedule a washing machine repair.',
      },
    ],
    preventiveTip:
      'Empty pockets before washing and clean the front pump filter every 3 months.',
  },
  {
    id: 'inverter-problems',
    title: 'Inverter problems',
    category: 'Inverter',
    summary:
      'Troubleshoot no backup power, overload beeps, charging indicators, and battery water maintenance safely.',
    riskLevel: 'High Safety Risk',
    estimatedTime: '10 min',
    preCheckSafetyBanner:
      'SAFETY NOTICE: Home inverters combine high-voltage AC mains and high-current DC batteries that produce hydrogen gas and corrosive acid. Wear dry shoes, avoid sparks/metal jewelry, and NEVER open the inverter casing. Contact a qualified technician for internal faults.',
    stopAndCallProSigns: [
      'Rotten egg / sulfur smell or swollen, hot battery casing',
      'Sparks, melted cables, or burning electronics odor',
      'Battery fails to hold charge for even 15 minutes under light load',
      'Inverter displays persistent short-circuit or internal fault code',
    ],
    steps: [
      {
        id: 'inv-1',
        title: 'Check overload & reset switch',
        instruction:
          'Continuous beeping or a red "Overload" LED means high-wattage appliances (iron, kettle, geyser, microwave) are connected to backup circuits. Switch off heavy appliances, turn the inverter front power button off for 30 seconds, and press the rear trip-reset button if popped out.',
        checkQuestion: 'Did reducing load and resetting restore normal backup power?',
        yesOutcome:
          'Issue resolved. Keep heavy resistive loads off the inverter backup line.',
        noNextHint: 'Next, verify AC mains input charging and front mode switch.',
      },
      {
        id: 'inv-2',
        title: 'Verify mains charging supply & UPS/Eco switch',
        instruction:
          'Confirm the wall socket feeding the inverter has power (test the mains switch/MCB) and that the "Mains On" / "Charging" indicator glows. Ensure the rear bypass switch is set to NORMAL (not BYPASS) and battery type selector matches your battery (Tubular/Flat/SMF).',
        safetyNote: 'Do not touch exposed wiring or modify wall sockets.',
        checkQuestion: 'Did restoring mains power or normal mode fix the problem?',
        yesOutcome:
          'Issue resolved. Allow 8–12 hours of uninterrupted charging to replenish the battery.',
        noNextHint: 'Next, perform a visual-only battery electrolyte and terminal check.',
      },
      {
        id: 'inv-3',
        title: 'Visual check of battery water floats & terminal corrosion',
        instruction:
          'For flooded tubular batteries, visually check the green/red water level float indicators—never look directly over open vents with a flame. If floats are in the red zone, top up ONLY with deionized distilled water (never tap water or acid). If white/green sulfation covers terminals or backup remains weak, call a qualified battery/inverter technician.',
        proWarning: true,
        safetyNote:
          'Battery acid causes severe burns. Do not disconnect live battery clamps without professional training.',
        checkQuestion:
          'Did topping up low distilled water and recharging restore backup duration?',
        yesOutcome:
          'Issue resolved. Schedule quarterly distilled water checks to extend battery life.',
        noNextHint:
          'Contact a qualified inverter technician to load-test the battery and inspect internal relays.',
      },
    ],
    preventiveTip:
      'Check battery distilled water float levels every 90 days and keep the inverter in a cool, well-ventilated area.',
  },
  {
    id: 'water-purifier-problems',
    title: 'Water purifier problems',
    category: 'Water purifier',
    summary:
      'Resolve slow water flow, tank not filling, unusual taste, and filter indicator alerts for RO/UV purifiers.',
    riskLevel: 'Low',
    estimatedTime: '10–15 min',
    preCheckSafetyBanner:
      'Unplug the purifier power adapter before inspecting electrical connections or wiping moisture inside under-sink cabinets.',
    stopAndCallProSigns: [
      'Water leaking from inside the electrical booster pump housing',
      'UV lamp alarm staying red continuously (compromised disinfection)',
      'Cloudy or foul-smelling water persisting after flushing',
    ],
    steps: [
      {
        id: 'wp-1',
        title: 'Verify inlet feed valve & household water pressure',
        instruction:
          'Check that the small diverter/angle valve supplying cold water to the purifier is fully open (handle aligned with the pipe) and that regular kitchen tap water pressure is normal.',
        checkQuestion: 'Was the feed valve partially closed and is flow restored?',
        yesOutcome: 'Issue resolved. Inlet water supply restored.',
        noNextHint: 'Next, inspect power indicator and reject-water drain line.',
      },
      {
        id: 'wp-2',
        title: 'Check power adapter & reject drain line',
        instruction:
          'Verify the power LED is lit and listen for the gentle hum of the booster pump when the tank is low. Inspect the flexible waste/reject tubing for kinks or blockage—a pinched drain line stops RO purification automatically.',
        checkQuestion: 'Did restoring power or straightening the drain tube fix flow?',
        yesOutcome: 'Issue resolved. Normal purification cycle resumed.',
        noNextHint: 'Next, evaluate filter cartridge age and TDS quality.',
      },
      {
        id: 'wp-3',
        title: 'Check filter replacement age & storage tank flush',
        instruction:
          'Sediment and carbon pre-filters typically clog every 6–12 months, causing very slow output or off-taste. If your cartridges are overdue (check your Maintenance tab), drain the storage tank once and schedule a filter cartridge replacement & TDS calibration.',
        checkQuestion:
          'Did flushing the tank improve taste, or are filters confirmed overdue?',
        yesOutcome:
          'Great—log a reminder to replace cartridges on schedule for safe drinking water.',
        noNextHint:
          'Book a water purifier technician to test the RO membrane, booster pump pressure, and UV lamp.',
      },
    ],
    preventiveTip:
      'Replace sediment and carbon filters every 6 months and check output TDS annually.',
  },
  {
    id: 'electrical-problems',
    title: 'Electrical problems',
    category: 'Electrical systems',
    summary:
      'Safe first-response checks for tripped breakers, dead outlets, and GFCI resets—with strict high-voltage safety boundaries.',
    riskLevel: 'High Safety Risk',
    estimatedTime: '5–10 min',
    requiresProfessionalImmediately: true,
    preCheckSafetyBanner:
      'HIGH-VOLTAGE SAFETY WARNING: Electrical repairs can cause electrocution or fire. Never remove panel covers, touch exposed wires, bypass breakers, or inspect wet outlets. For any burning smell, sparks, warm wall plates, flickering across multiple rooms, or repeated breaker trips, switch off power if safe and call a licensed electrician immediately.',
    stopAndCallProSigns: [
      'Burning plastic/fishy odor, scorch marks, or buzzing/crackling inside walls or outlets',
      'Breaker trips immediately again after unplugging appliances',
      'Outlets, switches, or extension cords feel warm or hot to the touch',
      'Mild shock/tingle when touching any metal appliance casing',
      'Lights dimming or brightening erratically across the whole home',
    ],
    steps: [
      {
        id: 'el-1',
        title: 'Emergency hazard screening (STOP CHECK)',
        instruction:
          'Before touching any switch or breaker, check for warning signs: Do you smell burning, see smoke/scorch marks, hear buzzing, or see water near outlets? If YES, do NOT reset anything—evacuate the area if needed and call a licensed electrician or emergency services immediately.',
        proWarning: true,
        safetyNote:
          'Never touch electrical panels with wet hands or while standing on a damp floor.',
        checkQuestion:
          'Did you observe ANY burning odor, sparks, heat, or water hazard? (Click "Yes" to stop safely and contact a professional)',
        yesOutcome:
          'STOP DIY IMMEDIATELY. Contact a licensed electrician right away. Log the incident in Repairs once safe.',
        noNextHint:
          'If completely clear of hazard signs, continue to safe GFCI / breaker checks.',
      },
      {
        id: 'el-2',
        title: 'Test and reset GFCI outlets (kitchen, bath, garage)',
        instruction:
          'If a single bathroom, kitchen, or outdoor outlet lost power, look for a nearby GFCI outlet with "TEST" and "RESET" buttons. Unplug appliances from the affected outlet first, then firmly press the RESET button until it clicks.',
        checkQuestion: 'Did pressing the GFCI RESET button safely restore power?',
        yesOutcome:
          'Issue resolved. If the GFCI trips again when plugging in a specific device, stop using that faulty appliance.',
        noNextHint: 'Next, check for a tripped breaker in the main panel.',
      },
      {
        id: 'el-3',
        title: 'Inspect main breaker panel (One-Reset Rule)',
        instruction:
          'Unplug heavy appliances in the dead room to rule out a circuit overload. Open the panel door (never remove the inner metal cover). Stand to the side, look for any breaker sitting in the middle/OFF position, flip it fully OFF, then firmly back ON ONCE.',
        proWarning: true,
        safetyNote:
          'ONE-RESET RULE: If the breaker trips again immediately or within minutes, DO NOT keep resetting it. This indicates a short circuit or ground fault requiring a licensed electrician.',
        checkQuestion:
          'Did unloading the circuit and resetting the breaker once keep power stable?',
        yesOutcome:
          'Circuit overload cleared. Avoid running multiple high-wattage appliances on the same circuit.',
        noNextHint:
          'Stop troubleshooting and call a licensed electrician immediately.',
      },
    ],
    preventiveTip:
      'Press the TEST and RESET buttons on GFCI outlets every 3 months and never daisy-chain power strips.',
  },
  {
    id: 'plumbing-leaks',
    title: 'Plumbing leaks',
    category: 'Plumbing',
    summary:
      'Immediate water shut-off steps and safe leak isolation for under-sink traps, faucets, toilets, and supply lines.',
    riskLevel: 'Moderate',
    estimatedTime: '10–15 min',
    preCheckSafetyBanner:
      'SAFETY NOTICE: If water is leaking near electrical outlets, ceiling fixtures, or your breaker panel, turn off electricity to that area first ONLY if the panel is completely dry. If you suspect a gas water heater leak or smell gas (rotten eggs), leave immediately and call your gas utility—never attempt DIY gas repairs.',
    stopAndCallProSigns: [
      'Water staining or bulging drywall/ceiling (hidden pressurized pipe leak)',
      'Main shut-off valve is seized or actively spraying water',
      'Sewage backup or multiple drains gurgling simultaneously',
      'Leak originating near a gas water heater burner or electrical panel',
    ],
    steps: [
      {
        id: 'pl-1',
        title: 'Stop active water damage (Locate shut-off valve)',
        instruction:
          'Place a bucket and towels beneath the drip. For a sink or toilet leak, turn the local angle-stop valve on the wall clockwise (or quarter-turn perpendicular to the pipe) to shut off supply. For a burst pipe, shut off your home’s main water valve immediately.',
        checkQuestion:
          'Have you stopped or safely contained the active flow of water?',
        yesOutcome:
          'Good—water damage is contained. Proceed to identify the leak source or call a plumber.',
        noNextHint:
          'If the valve will not close or water is spraying, call an emergency plumber immediately.',
      },
      {
        id: 'pl-2',
        title: 'Determine supply-line vs. drain-pipe leak',
        instruction:
          'Dry the pipes thoroughly with a paper towel. If water appears even with the faucet OFF, the pressurized supply line or braided hose is leaking. If water only drips while water runs down the sink, the unpressurized P-trap or slip-joint nut is leaking.',
        checkQuestion:
          'Is the leak strictly a loose plastic P-trap slip nut under a sink that tightens snugly by hand?',
        yesOutcome:
          'Hand-tightening a loose plastic slip nut often seals minor drain drips. Run water for 2 minutes to verify dryness.',
        noNextHint: 'Next, check toilet flapper/fill valve or call a licensed plumber.',
      },
      {
        id: 'pl-3',
        title: 'Inspect braided supply hoses & hidden pipe signs',
        instruction:
          'Inspect flexible braided supply lines for rust, bulging, or weeping crimp fittings. Pressurized supply-line failures, corroded copper/PEX joints, or any leak inside walls/ceilings require professional replacement to prevent flooding and mold.',
        proWarning: true,
        safetyNote:
          'Do not overtighten metal valves with heavy wrenches—cracking a wall stub-out can flood the room.',
        checkQuestion:
          'Was the leak isolated to a simple replaceable washer/aerators with zero wall moisture?',
        yesOutcome:
          'Monitor the area with a dry paper towel underneath for 24 hours to be 100% certain the leak stopped.',
        noNextHint:
          'Keep the supply valve closed and contact a licensed plumber.',
      },
    ],
    preventiveTip:
      'Label your home main water shut-off valve clearly and inspect under-sink cabinets and braided hoses every 6 months.',
  },
];
