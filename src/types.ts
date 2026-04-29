export interface Goalkeeper {
  id: string;
  name: string;
  category: string;
  status: 'Ready' | 'Minor Strain' | 'In Training' | 'Injured';
  form: number;
  recovery: number;
  load: number;
  imageUrl: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  membership?: 'permanent' | 'trial';
  trialStartDate?: string;
  trialEndDate?: string;
  trialNotes?: string;
  preferredFoot?: 'left' | 'right' | 'both';
  dominantHand?: 'left' | 'right';
  wingspan?: number;
  phone?: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  clubAffiliation?: string;
  registrationDate?: string;
  jerseyNumber?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified';

export interface Attendance {
  id: string;
  session_id: string;
  goalkeeper_id: string;
  status: AttendanceStatus;
  notes?: string;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  created_at: string;
}

export interface WellnessLog {
  id: string;
  goalkeeper_id: string;
  date: string;
  sleep: number;    // 1-5
  stress: number;   // 1-5
  fatigue: number;  // 1-5
  soreness: number; // 1-5
  mood: number;     // 1-5
  score: number;    // calculated average
  notes?: string;
  created_at: string;
}

export interface GoalkeeperNote {
  id: string;
  user_id: string;
  goalkeeper_id: string;
  date: string;
  category: 'technical' | 'tactical' | 'behavioral' | 'medical';
  text: string;
  created_at: string;
}

export interface CompetencyAssessment {
  id: string;
  user_id: string;
  goalkeeper_id: string;
  date: string;
  assessments: { category: string; score: number }[];
  notes?: string;
  created_at: string;
}

export interface Injury {
  id: string;
  user_id: string;
  goalkeeper_id: string;
  startDate: string;
  endDate?: string;
  bodyPart: string;
  injuryType: string;
  severity: 'mild' | 'moderate' | 'severe';
  treatment?: string;
  returnToPlayStatus?: 'not_started' | 'phase_1' | 'phase_2' | 'phase_3' | 'cleared';
  notes?: string;
  created_at: string;
}

export interface DevelopmentGoal {
  id: string;
  user_id: string;
  goalkeeper_id: string;
  title: string;
  category: 'technical' | 'tactical' | 'physical' | 'psychological';
  description?: string;
  targetDate?: string;
  status: 'pending' | 'in_progress' | 'achieved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface Exercise {
  id: string;
  type: 'shotStopping' | 'crosses' | 'oneVsOne' | 'footwork' | 'distribution' | 'depthControl' | 'setPieces' | 'warmup' | 'gym';
  title: string;
  category?: string; // e.g. 'Strength', 'Agility', etc.
  objective: string | string[];
  organization: string | string[]; // space, materials, players
  execution: string | string[];
  progression: string | string[];
  successCriteria: string | string[];
  repetitions?: string;
  duration: string | string[];
  intensity: 'low' | 'medium' | 'high';
  gameMoment?: string;
  tacticalPrinciples?: string[];
  startingPoint?: string;
  coachingPoints?: string | string[];
  diagram?: string; // JSON or Base64 image
}

export interface IntegratedExercise {
  id: string;
  format: string | string[];
  number: string | string[];
  space: string | string[];
  time: string | string[];
  diagram?: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  category: string | string[];
  gameMoments?: string[];
  tacticalPrinciples?: string[];
  numAthletes: number;
  duration: string | string[];
  generalObjectives: string[];
  
  gym: Exercise[]; // Gym (pre-training) exercises

  warmup: Exercise[]; // Warmup drills

  exercises: Exercise[]; // Main part (1, 2, 3)

  integratedWithTeam?: IntegratedExercise[];

  coolDown: string | string[];

  observations: {
    positives: string | string[];
    adjustments: string | string[];
    individualEval: string | string[];
  };

  athleteObservations?: {
    athleteId: string;
    text: string;
    interventionType?: 'command' | 'guided' | 'q_a';
  }[];

  // UI metadata
  titles: string[];
  imageUrl?: string;
  isLive?: boolean;
  focus?: string[];
  time?: string;
  attending?: string[];
  attendance?: Attendance[];
  mesocycle?: string;
  microcycleId?: string;
}


export interface GameModelPrinciple {
  id: string;
  moment: 'attacking' | 'defending' | 'attackTransition' | 'defenseTransition';
  principles: string[];
}

export interface CompetencyProfile {
  id: string;
  category: 'technical' | 'tactical' | 'physical' | 'psychological';
  competencies: string[];
}

export interface PeriodizationPhase {
  id: string;
  name: string;
  duration: string;
  objectives: string[];
  intensity: string;
}

export interface Methodology {
  gameModel: GameModelPrinciple[];
  competencyProfiles: CompetencyProfile[];
  periodization: PeriodizationPhase[];
  notes: string;
}

export interface PerformanceVideo {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
  status: 'Analysis Ready' | 'Uncut' | 'Edited';
}

export interface SavedMicrocycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  matchDay: string | null;
  matchOpponent?: string;
  matchLocation?: string;
  matchTime?: string;
  matchCompetition?: string;
  restDays?: string[];
  mesocycle?: string;
}
