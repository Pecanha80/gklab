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


export interface Exercise {
  id: string;
  type: 'analytical' | 'decision' | 'contextualized' | 'warmup';
  title: string;
  category?: string; // e.g. 'Strength', 'Agility', etc.
  objective: string | string[];
  organization: string | string[]; // space, materials, players
  execution: string | string[];
  progression: string | string[];
  successCriteria: string | string[];
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
  
  // Specific Objectives
  objectives: {
    technical: string | string[];
    tactical: string | string[];
    physical: string | string[];
    cognitive: string | string[];
  };

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
