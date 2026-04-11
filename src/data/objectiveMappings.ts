export interface ObjectiveMapping {
  technical: string;
  tactical: string;
  physical: string;
  cognitive: string;
  warmupObjective?: string;
  warmupDescription?: string;
  warmupOrganization?: string;
}

export const OBJECTIVE_MAPPINGS: Record<string, ObjectiveMapping> = {
  'improveOverallHandlingPositioning': {
    technical: 'handEyeCoordinationBalance',
    tactical: 'goalProtection',
    physical: 'agility',
    cognitive: 'focus',
    warmupObjective: 'neuromuscularActivation',
    warmupDescription: 'injuryPreventionAndMobility',
    warmupOrganization: 'sixYardBoxHurdlesAgilityLadder'
  },
  'enhanceDistributionAccuracy': {
    technical: 'increaseDistributionRangeAccuracyFeet',
    tactical: 'counterAttackStart',
    physical: 'explosivePower',
    cognitive: 'decisionMaking',
    warmupObjective: 'technicalRefinementOfBasicHandling',
    warmupDescription: 'visualTrackingActivation',
    warmupOrganization: 'penaltyAreaOneCoachTenBalls'
  },
  'developAerialDominance': {
    technical: 'uncontestedCrossClaiming',
    tactical: 'setPieceOrganization',
    physical: 'strength',
    cognitive: 'focus',
    warmupObjective: 'injuryPreventionAndMobility',
    warmupDescription: 'neuromuscularActivation',
    warmupOrganization: 'sixYardBoxHurdlesAgilityLadder'
  },
  'strengthenOneVOneShotStopping': {
    technical: 'oneVOneSpreadTechnique',
    tactical: 'spaceProtection',
    physical: 'explosivePower',
    cognitive: 'decisionMaking',
    warmupObjective: 'mentalFocusAndAlertness',
    warmupDescription: 'addDecisionMakingElements',
    warmupOrganization: 'smallGoalOneServerFiveBalls'
  },
  'improveReactionSpeedReflexes': {
    technical: 'enhanceReactionSpeedCloseRangeShots',
    tactical: 'spaceProtection',
    physical: 'reactionSpeed',
    cognitive: 'scanning',
    warmupObjective: 'visualTrackingActivation',
    warmupDescription: 'addCognitiveTasks',
    warmupOrganization: 'rebounderNet OneServerFiveBalls'
  },
  'masterSweeperKeeperActions': {
    technical: 'throughBallInterceptions',
    tactical: 'defensiveLineOrg',
    physical: 'reactionSpeed',
    cognitive: 'anticipation',
    warmupObjective: 'addDecisionMakingElements',
    warmupDescription: 'introduceCompetitionBetweenGKs',
    warmupOrganization: 'oneVOneZoneBoxEdgeToGoal'
  }
};
