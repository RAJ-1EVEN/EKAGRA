// EKAGRA — Exercise Database
// Each exercise: name, type (compound/isolation), cues {internal, external}

const MUSCLES = [
  {
    id: 'side_delts',
    name: 'SIDE DELTS',
    short: 'Side Delts',
    targetMin: 16, targetMax: 22,
    freq: '3–4x/week',
    note: 'Your priority. Side delts recover fast and dramatically improve proportions — naturals with aesthetic goals thrive on higher volume here.',
    exercises: [
      {
        name: 'Cable Lateral Raises', type: 'isolation',
        cues: {
          internal: 'Squeeze the delt at the top, lead with the elbow',
          external: 'Pour water out of a jug at the top of the movement'
        }
      },
      {
        name: 'Dumbbell Lateral Raises', type: 'isolation',
        cues: {
          internal: 'Lead with elbows, slight torso lean away from the weight',
          external: 'Raise the dumbbells like wings, stop before traps take over'
        }
      },
      {
        name: 'Leaning Laterals', type: 'isolation',
        cues: {
          internal: 'Lean into the rack, isolate the top portion of the raise',
          external: 'Move the dumbbell in an arc away from your hip, not straight up'
        }
      },
      {
        name: 'Partial Laterals (finisher)', type: 'isolation',
        cues: {
          internal: 'Burn out the top half-range only, fast tempo',
          external: 'Pulse the weight in the top 6 inches of the path'
        }
      }
    ]
  },
  {
    id: 'rear_delts',
    name: 'REAR DELTS',
    short: 'Rear Delts',
    targetMin: 12, targetMax: 18,
    freq: '2-3x/week',
    note: 'Massively underrated for aesthetics. Creates 3D shoulders, wider look, stronger posture. Train often.',
    exercises: [
      {
        name: 'Rear Delt Rows', type: 'compound',
        cues: {
          internal: 'Drive elbows back and up, squeeze shoulder blades',
          external: 'Pull the handles toward your ears, not your ribs'
        }
      },
      {
        name: 'Reverse Pec Deck', type: 'isolation',
        cues: {
          internal: 'Open the chest, feel the stretch across the back of the shoulder',
          external: 'Sweep your arms backward like opening curtains'
        }
      },
      {
        name: 'Cable Rear Fly', type: 'isolation',
        cues: {
          internal: 'Keep a slight elbow bend, control the eccentric',
          external: 'Draw an arc with your hands from front to back'
        }
      }
    ]
  },
  {
    id: 'front_delts',
    name: 'FRONT DELTS',
    short: 'Front Delts',
    targetMin: 0, targetMax: 6,
    freq: 'as needed',
    note: 'Already hit hard from pressing. Too much direct front delt work overpowers the V-taper and shrinks the visual width of your shoulders. Keep this minimal or zero.',
    exercises: [
      {
        name: 'Front Raises (optional)', type: 'isolation',
        cues: {
          internal: 'Raise to eye level only, controlled tempo',
          external: 'Lift the weight like pouring it into a cup at forehead height'
        }
      }
    ]
  },
  {
    id: 'upper_chest',
    name: 'UPPER CHEST',
    short: 'Upper Chest',
    targetMin: 12, targetMax: 16,
    freq: '2x/week',
    note: 'Confirmed weak point — prioritized. Split: incline pressing 6-8 sets, flat press/fly 4-6 sets, stretch movement 2-4 sets. Too much overall chest can overpower aesthetics and make shoulders look smaller.',
    exercises: [
      {
        name: 'Incline Smith Press', type: 'compound',
        cues: {
          internal: 'Drive through the upper chest, tuck elbows to 45°',
          external: 'Push the bar up and slightly back toward your face'
        }
      },
      {
        name: 'Incline Dumbbell Press', type: 'compound',
        cues: {
          internal: '2 sec stretch at the bottom, squeeze chest at the top',
          external: 'Press the dumbbells together like closing a book above you'
        }
      },
      {
        name: 'Cable Upper Chest Fly', type: 'isolation',
        cues: {
          internal: 'Feel the stretch across the upper pec, squeeze inward',
          external: 'Bend the bar inward as you bring your hands together'
        }
      }
    ]
  },
  {
    id: 'lats',
    name: 'BACK — LATS (WIDTH)',
    short: 'Lats',
    targetMin: 14, targetMax: 18,
    freq: '2-3x/week',
    note: 'For your V-taper. Width-focused movements: pull-ups, pulldowns, unilateral rows.',
    exercises: [
      {
        name: 'Weighted Pull-Ups', type: 'compound',
        cues: {
          internal: 'Drive elbows down into your hips, don\u2019t curl the weight',
          external: 'Pull your chest up to meet the bar'
        }
      },
      {
        name: 'Neutral Grip Pulldowns', type: 'compound',
        cues: {
          internal: 'Keep wrists quiet, 2 sec stretch at the top',
          external: 'Pull the bar down toward your hip pockets'
        }
      },
      {
        name: 'Unilateral Cable Row', type: 'compound',
        cues: {
          internal: 'Drive the elbow back, rotate the torso slightly into the pull',
          external: 'Row the handle toward your back pocket'
        }
      }
    ]
  },
  {
    id: 'upper_back',
    name: 'BACK — THICKNESS',
    short: 'Upper Back',
    targetMin: 10, targetMax: 14,
    freq: '2x/week',
    note: 'For a dense look from the side and back: chest-supported rows, cable rows, rear delt rows.',
    exercises: [
      {
        name: 'Chest-Supported Row', type: 'compound',
        cues: {
          internal: 'Squeeze shoulder blades together at the top, pause briefly',
          external: 'Pull the handles into your ribcage'
        }
      },
      {
        name: 'Seated Cable Row', type: 'compound',
        cues: {
          internal: 'Lead with the elbows, keep chest tall throughout',
          external: 'Pull the handle to your belly button'
        }
      }
    ]
  },
  {
    id: 'biceps',
    name: 'BICEPS',
    short: 'Biceps',
    targetMin: 14, targetMax: 20,
    freq: '2x/week',
    note: 'Long-head emphasis, stretched-position curls, controlled reps — for the thick David-style arm shape.',
    exercises: [
      {
        name: 'Bayesian Curls', type: 'isolation',
        cues: {
          internal: 'Feel the deep stretch at the bottom, curl from full extension',
          external: 'Pull the cable from behind your body up toward your shoulder'
        }
      },
      {
        name: 'Incline Dumbbell Curls', type: 'isolation',
        cues: {
          internal: 'Let the arm hang fully behind the torso at the bottom',
          external: 'Curl the dumbbell up while your elbow stays pinned back'
        }
      },
      {
        name: 'Preacher Curls', type: 'isolation',
        cues: {
          internal: 'Control the negative, don\u2019t bounce out of the stretch',
          external: 'Curl the bar up along the pad in a straight line'
        }
      },
      {
        name: 'Hammer Curls', type: 'isolation',
        cues: {
          internal: 'Keep elbows pinned, squeeze the brachialis at the top',
          external: 'Curl the dumbbells like hammering a nail upward'
        }
      }
    ]
  },
  {
    id: 'triceps',
    name: 'TRICEPS',
    short: 'Triceps',
    targetMin: 14, targetMax: 20,
    freq: '2x/week',
    note: 'Most important for arm thickness. Priority: long head.',
    exercises: [
      {
        name: 'Overhead Cable Extensions', type: 'isolation',
        cues: {
          internal: 'Feel the long head stretch overhead, extend fully',
          external: 'Pull the rope down and apart at the bottom'
        }
      },
      {
        name: 'Skull Crushers', type: 'isolation',
        cues: {
          internal: 'Keep elbows fixed, lower the bar to behind your head',
          external: 'Lower the bar toward the bench behind your head, then press away'
        }
      },
      {
        name: 'Weighted Dips', type: 'compound',
        cues: {
          internal: 'Keep torso upright to bias triceps over chest',
          external: 'Push your body straight up away from the floor'
        }
      },
      {
        name: 'Cable Pushdowns', type: 'isolation',
        cues: {
          internal: 'Keep elbows pinned to sides, full lockout squeeze',
          external: 'Push the bar down and slightly forward'
        }
      }
    ]
  },
  {
    id: 'forearms',
    name: 'FOREARMS',
    short: 'Forearms',
    targetMin: 8, targetMax: 14,
    freq: '2x/week',
    note: 'Underrated for the "strong aesthetic" look.',
    exercises: [
      {
        name: 'Hammer Curls', type: 'isolation',
        cues: {
          internal: 'Squeeze the forearm at the top of each rep',
          external: 'Curl like hammering a nail'
        }
      },
      {
        name: 'Reverse Barbell Curls', type: 'isolation',
        cues: {
          internal: 'Keep wrists firm, drive through the top of the forearm',
          external: 'Curl the bar up with palms facing the floor'
        }
      },
      {
        name: 'Wrist Curls', type: 'isolation',
        cues: {
          internal: 'Isolate the wrist joint only, full range',
          external: 'Curl just your fingers and wrist, forearm resting still'
        }
      }
    ]
  },
  {
    id: 'quads',
    name: 'QUADS',
    short: 'Quads',
    targetMin: 10, targetMax: 14,
    freq: '2x/week',
    note: 'Enough for growth without killing recovery.',
    exercises: [
      {
        name: 'Back Squat', type: 'compound',
        cues: {
          internal: 'Drive knees out, brace core before descending',
          external: 'Sit back into an imaginary chair behind you'
        }
      },
      {
        name: 'Leg Press', type: 'compound',
        cues: {
          internal: 'Control the negative, don\u2019t let lower back round',
          external: 'Push the platform away through your heels'
        }
      },
      {
        name: 'Leg Extension (VMO focus)', type: 'isolation',
        cues: {
          internal: 'Squeeze hard at full lockout, point toes slightly out',
          external: 'Kick the pad up and out'
        }
      }
    ]
  },
  {
    id: 'hamstrings',
    name: 'HAMSTRINGS',
    short: 'Hamstrings',
    targetMin: 8, targetMax: 12,
    freq: '1-2x/week',
    note: 'Important for side leg thickness, athletic look, and injury prevention. RDLs are king.',
    exercises: [
      {
        name: 'Romanian Deadlift', type: 'compound',
        cues: {
          internal: 'Push hips back first, feel the hamstring stretch before bending knees',
          external: 'Slide the bar down your legs like closing a drawer'
        }
      },
      {
        name: 'Lying Leg Curl', type: 'isolation',
        cues: {
          internal: 'Squeeze the hamstring fully at the top, slow negative',
          external: 'Curl your heels toward your glutes'
        }
      },
      {
        name: 'Seated Leg Curl', type: 'isolation',
        cues: {
          internal: 'Keep hips pinned to the pad throughout',
          external: 'Pull the pad down and under the seat'
        }
      }
    ]
  },
  {
    id: 'glutes',
    name: 'GLUTES',
    short: 'Glutes',
    targetMin: 4, targetMax: 8,
    freq: 'as needed',
    note: 'Squats + RDLs usually cover this unless specifically prioritizing.',
    exercises: [
      {
        name: 'Hip Thrust', type: 'compound',
        cues: {
          internal: 'Squeeze glutes hard at the top, avoid lower back arching',
          external: 'Drive your hips toward the ceiling'
        }
      },
      {
        name: 'Cable Kickback', type: 'isolation',
        cues: {
          internal: 'Squeeze the glute at full extension, don\u2019t use momentum',
          external: 'Kick your heel back and up toward the ceiling'
        }
      }
    ]
  },
  {
    id: 'calves',
    name: 'CALVES',
    short: 'Calves',
    targetMin: 10, targetMax: 16,
    freq: '2-4x/week',
    note: 'Higher frequency works best.',
    exercises: [
      {
        name: 'Standing Calf Raise', type: 'isolation',
        cues: {
          internal: 'Pause at the top, full stretch at the bottom',
          external: 'Push the balls of your feet into the floor and rise tall'
        }
      },
      {
        name: 'Seated Calf Raise', type: 'isolation',
        cues: {
          internal: 'Slow tempo, deep stretch at the bottom of each rep',
          external: 'Press your knees up by raising your heels'
        }
      }
    ]
  },
  {
    id: 'abs',
    name: 'ABS',
    short: 'Abs',
    targetMin: 8, targetMax: 14,
    freq: '2x/week',
    note: 'Weighted abs, not endless crunches. Abs mostly come from staying lean.',
    exercises: [
      {
        name: 'Hanging Leg Raises', type: 'isolation',
        cues: {
          internal: 'Curl the pelvis up at the top, control the descent',
          external: 'Bring your knees toward your chest, then your chest toward your knees'
        }
      },
      {
        name: 'Cable Crunches', type: 'isolation',
        cues: {
          internal: 'Round the spine, crunch the ribs toward the hips',
          external: 'Curl your head down toward your belly button'
        }
      },
      {
        name: 'Decline Weighted Sit-Ups', type: 'isolation',
        cues: {
          internal: 'Lead with the chest, controlled full range',
          external: 'Roll your spine up off the bench one segment at a time'
        }
      }
    ]
  }
];

// Rest timer defaults (seconds)
const REST_DEFAULTS = {
  compound: 165, // 2:45 avg of 2:30-3:00
  isolation: 75   // avg of 60-90
};

// Astrological focus cues by day (Vedic planetary rulership — flavor text)
const DAY_FOCUS = [
  // Sunday = Sun
  { ruler: 'Sun', cue: 'Sun rules today — center, identity, the chest and heart. Train with presence.' },
  // Monday = Moon
  { ruler: 'Moon', cue: 'Moon rules today — adaptability, recovery, flow. A good day to listen to your body.' },
  // Tuesday = Mars
  { ruler: 'Mars', cue: 'Mars rules today — aggression, drive, legs. Channel intensity into the lower body.' },
  // Wednesday = Mercury
  { ruler: 'Mercury', cue: 'Mercury rules today — precision, detail work. Focus on form over load.' },
  // Thursday = Jupiter
  { ruler: 'Jupiter', cue: 'Jupiter rules today — expansion, growth. A strong day to push volume.' },
  // Friday = Venus
  { ruler: 'Venus', cue: 'Venus rules today — aesthetics, balance. Train the mirror muscles with intention.' },
  // Saturday = Saturn
  { ruler: 'Saturn', cue: 'Saturn rules today — discipline, structure, endurance. Show up regardless of mood.' }
];

// Default weekly schedule (6-day LPP x2)
const DEFAULT_SCHEDULE = [
  { day: 'Monday', label: 'Legs 1', focus: ['quads', 'hamstrings', 'calves', 'glutes'] },
  { day: 'Tuesday', label: 'Push 1', focus: ['upper_chest', 'side_delts', 'triceps', 'front_delts'] },
  { day: 'Wednesday', label: 'Pull 1', focus: ['lats', 'upper_back', 'rear_delts', 'biceps'] },
  { day: 'Thursday', label: 'Legs 2', focus: ['quads', 'hamstrings', 'calves', 'abs'] },
  { day: 'Friday', label: 'Push 2', focus: ['upper_chest', 'side_delts', 'triceps', 'forearms'] },
  { day: 'Saturday', label: 'Pull 2', focus: ['lats', 'upper_back', 'rear_delts', 'biceps', 'forearms'] },
  { day: 'Sunday', label: 'Rest', focus: ['abs'] }
];
