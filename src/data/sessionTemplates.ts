import { TrainingSession } from '../types';

export const SESSION_TEMPLATES: Record<string, Partial<TrainingSession>> = {
  'shotStoppingCentralAngled': {
    generalObjectives: ['improveOverallHandlingPositioning'],
    objectives: {
      technical: 'positioningDivingParrying',
      tactical: 'positioningRelativeBall',
      physical: 'explosivePowerAgility',
      cognitive: 'readingShooterAnticipation',
    },
    warmup: [
      {
        id: crypto.randomUUID(),
        type: 'warmup',
        title: 'prepareMusclesExplosive',
        objective: 'prepareMusclesExplosive',
        organization: 'sixYardBoxHurdlesAgilityLadder',
        execution: 'dynamicStretchingLightHandling',
        progression: 'increaseShotSpeed',
        successCriteria: '',
        duration: 'dur_15min',
        intensity: 'low'
      }
    ],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'centralShotStopping',
        objective: 'focusSetPositionDiving',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'serverShootsFromEdgeSaves',
        progression: 'addPassivePressureScreen',
        successCriteria: 'cleanSaveParrySafe',
        duration: 'dur_15min',
        intensity: 'high',
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'angledShotsRebounds',
        objective: 'improvePositioningRecovery',
        organization: 'penaltyAreaTwoServersAngles',
        execution: 'server1ShootsRebound',
        progression: 'varyShotTypes',
        successCriteria: 'quickRecoveryCorrectPositioning',
        duration: 'dur_20min',
        intensity: 'high',
      }
    ],
    integratedWithTeam: [{ id: crypto.randomUUID(), format: 'smallSidedGame', number: 'gkPlus6vs6PlusGk', space: 'halfFieldSpace', time: 'dur_25min' }],
    coolDown: 'lightJoggingStaticStretching',
  },
  'handlingCatchingFundamentals': {
    generalObjectives: ['refineBasicHandlingCatching'],
    objectives: {
      technical: 'wCatchScoopCupContour',
      tactical: 'decisionCatchVsParry',
      physical: 'handEyeCoordinationBalance',
      cognitive: 'focusTrackingTrajectory',
    },
    warmup: [
      {
        id: crypto.randomUUID(),
        type: 'warmup',
        title: 'activateHandEyeCoordination',
        objective: 'activateHandEyeCoordination',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'lightJoggingJointMobility',
        progression: 'increaseSpeedComplexityJuggling',
        successCriteria: '',
        duration: 'dur_10min',
        intensity: 'low'
      }
    ],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'staticHandlingWScoopCup',
        objective: 'perfectMechanicsCatches',
        organization: 'sixYardBoxOneServerFiveBalls',
        execution: 'serverVolleysVaryingHeights',
        progression: 'increaseVolleySpeedLateral',
        successCriteria: 'cleanCatchNoDrops',
        duration: 'dur_15min',
        intensity: 'low',
      }
    ],
    integratedWithTeam: [{ id: crypto.randomUUID(), format: 'possession4v4GK', number: 'gkPlus4vs4PlusGk', space: 'grid40x40m', time: 'dur_20min' }],
    coolDown: 'upperBodyStretchingWristMobility',
  },
  'divingTechniques': {
    generalObjectives: ['developEffectiveSafeDiving'],
    objectives: {
      technical: 'stepAndDiveLandingMechanics',
      tactical: 'choosingRightDive',
      physical: 'explosiveLegPowerCoreFlexibility',
      cognitive: 'timingSpatialAwareness',
    },
    warmup: [
      {
        id: crypto.randomUUID(),
        type: 'warmup',
        title: 'warmUpHipsShouldersImpact',
        objective: 'warmUpHipsShouldersImpact',
        organization: 'smallGoalOneServerFiveBalls',
        execution: 'dynamicStretchingLowCollapseDives',
        progression: 'moveFromKneesToStanding',
        successCriteria: '',
        duration: 'dur_15min',
        intensity: 'low'
      }
    ],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'lateralDivingLowMid',
        objective: 'focusFootworkAttackingForward',
        organization: 'smallGoalOneServerFiveBalls',
        execution: 'gkStartsCenterStepsDives',
        progression: 'increaseShotSpeedHurdle',
        successCriteria: 'diveForwardCatchParry',
        duration: 'dur_20min',
        intensity: 'medium',
      }
    ],
    integratedWithTeam: [{ id: crypto.randomUUID(), format: 'attackVsDefense', number: 'gkPlus6vs4', space: 'halfFieldSpace', time: 'dur_25min' }],
    coolDown: 'foamRollingStaticStretchingHips',
  },
  'oneVOneSituations': {
    generalObjectives: ['strengthenOneVOneShotStopping'],
    objectives: {
      technical: 'oneVOneSpreadTechnique',
      tactical: 'spaceProtection',
      physical: 'explosivePower',
      cognitive: 'decisionMaking',
    },
    warmup: [
      {
        id: crypto.randomUUID(),
        type: 'warmup',
        title: 'mentalFocusAndAlertness',
        objective: 'mentalFocusAndAlertness',
        organization: 'rebounderNetOneServerFiveBalls',
        execution: 'reactionGamesSmallBalls',
        progression: 'addDecisionMakingElements',
        successCriteria: '',
        duration: 'dur_15min',
        intensity: 'medium'
      }
    ],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'oneVOneSpreadTechnique',
        objective: 'masterSpreadKBlockTechnique',
        organization: 'oneVOneZoneBoxEdgeToGoal',
        execution: 'serverPlaysThroughBallGkMustDecide',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'masterSpreadKBlockTechnique',
        duration: 'dur_20min',
        intensity: 'high',
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'oneVOneSmotheringFrontDive',
        objective: 'enhanceReactionSpeedCloseRangeShots',
        organization: 'smallGoalOneServerFiveBalls',
        execution: 'gkFacesAwayTurnsOnCommand',
        progression: 'reduceReactionTimeDistanceShot',
        successCriteria: 'cleanSaveParrySafe',
        duration: 'dur_15min',
        intensity: 'high',
      }
    ]
  },
  'crossesAerialDominance': {
    generalObjectives: ['developAerialDominance'],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'uncontestedCrossClaiming',
        objective: 'developTimingTrajectoryReadingConfidence',
        organization: 'fullGoalTwoWingersCrossing',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'increaseDistanceAngleCrossShot',
        successCriteria: 'attackingBallAtHighestPoint',
        duration: 'dur_20min',
        intensity: 'medium',
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'crossesWithPassivePressure',
        objective: 'developTimingTrajectoryReadingConfidence',
        organization: 'penaltyAreaMannequinsSimulatingTraffic',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'firmCatchWithoutRebounds',
        duration: 'dur_20min',
        intensity: 'high',
      }
    ]
  },
  'distributionBuildupPlay': {
    generalObjectives: ['enhanceDistributionAccuracy'],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'goalKickTargetPractice',
        objective: 'increaseDistributionRangeAccuracyFeet',
        organization: 'fullPitchTargetsAt30m50m70m',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'requireSpecificDistributionType',
        successCriteria: 'cleanDistributionReachingTargetZone',
        duration: 'dur_15min',
        intensity: 'medium',
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'sideVolleyDropKickDistribution',
        objective: 'improveQuickDistributionHands',
        organization: 'fullPitchTargetsAt30m50m70m',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'reduceReactionTimeDistanceShot',
        successCriteria: 'cleanDistributionReachingTargetZone',
        duration: 'dur_15min',
        intensity: 'medium',
      }
    ]
  },
  'reactionSpeedReflexes': {
    generalObjectives: ['improveReactionSpeedReflexes'],
    objectives: {
      technical: 'handEyeCoordinationBalance',
      tactical: 'defensiveLineOrg',
      physical: 'reactionSpeed',
      cognitive: 'scanning',
    },
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'deflectedShotReactions',
        objective: 'enhanceReactionSpeedCloseRangeShots',
        organization: 'penaltyAreaMannequinsSimulatingTraffic',
        execution: 'serverShootsThroughMannequins',
        progression: 'reduceReactionTimeDistanceShot',
        successCriteria: 'cleanSaveParrySafe',
        duration: 'dur_15min',
        intensity: 'high',
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'turnSaveBlindReactions',
        objective: 'enhanceReactionSpeedCloseRangeShots',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'gkFacesAwayTurnsOnCommand',
        progression: 'addSecondBallImmediatelyAfterFirstSave',
        successCriteria: 'correctDecisionMaking90Percent',
        duration: 'dur_15min',
        intensity: 'high',
      }
    ]
  },
  'sweeperKeeperSpaceDefense': {
    generalObjectives: ['masterSweeperKeeperActions'],
    objectives: {
      technical: 'clearancesOutsideTheBox',
      tactical: 'spaceProtection',
      physical: 'agility',
      cognitive: 'anticipation',
    },
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'throughBallInterceptions',
        objective: 'enhanceDecisionMakingSweeperKeeper',
        organization: 'oneVOneZoneBoxEdgeToGoal',
        execution: 'serverPlaysThroughBallGkMustDecide',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'correctDecisionMaking90Percent',
        duration: 'dur_20min',
        intensity: 'medium',
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'clearancesOutsideTheBox',
        objective: 'increaseDistributionRangeAccuracyFeet',
        organization: 'fullPitchTargetsAt30m50m70m',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'requireSpecificDistributionType',
        successCriteria: 'cleanDistributionReachingTargetZone',
        duration: 'dur_15min',
        intensity: 'medium',
      }
    ]
  },
  'doubleSavesQuickRecovery': {
    generalObjectives: ['improveOverallHandlingPositioning'],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'doubleSaveShotRebound',
        objective: 'improveAbilityRecoverQuicklySecondarySaves',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'gkMakesInitialDivingSaveQuicklyRecovers',
        progression: 'addSecondBallImmediatelyAfterFirstSave',
        successCriteria: 'noReboundsConcededDangerousAreas',
        duration: 'dur_20min',
        intensity: 'high',
      }
    ]
  },
  'setPiecesDefense': {
    generalObjectives: ['developAerialDominance'],
    objectives: {
      technical: 'wCatchScoopCupContour',
      tactical: 'setPieceOrganization',
      physical: 'coreStability',
      cognitive: 'communication',
    },
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'trafficCrossesPunching',
        objective: 'developTimingTrajectoryReadingConfidence',
        organization: 'penaltyAreaMannequinsSimulatingTraffic',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'attackingBallAtHighestPoint',
        duration: 'dur_25min',
        intensity: 'high',
      }
    ]
  },
  'cognitiveSkillsDecisionMaking': {
    generalObjectives: ['improveReactionSpeedReflexes'],
    objectives: {
      technical: 'stepAndDiveLandingMechanics',
      tactical: 'backPassSupport',
      physical: 'reactionSpeed',
      cognitive: 'decisionMaking',
    },
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'reactionToThroughBalls',
        objective: 'enhanceDecisionMakingSweeperKeeper',
        organization: 'oneVOneZoneBoxEdgeToGoal',
        execution: 'serverPlaysThroughBallGkMustDecide',
        progression: 'addVisualCognitiveConstraints',
        successCriteria: 'correctDecisionMaking90Percent',
        duration: 'dur_20min',
        intensity: 'medium',
      }
    ]
  },
  'physicalConditioningPlyometrics': {
    generalObjectives: ['improveOverallHandlingPositioning'],
    objectives: {
      technical: 'positioningDivingParrying',
      tactical: 'goalProtection',
      physical: 'explosivePower',
      cognitive: 'focus',
    },
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'powerDivesOverHurdles',
        objective: 'buildExplosiveLegPower',
        organization: 'sixYardBoxHurdlesAgilityLadder',
        execution: 'gkPerformsLadderFootworkThenDives',
        progression: 'increaseShotSpeedHurdle',
        successCriteria: 'maintainingBalanceSetPosition',
        duration: 'dur_20min',
        intensity: 'high',
      }
    ]
  },
  'matchSimulationContextualScenarios': {
    generalObjectives: ['strengthenOneVOneShotStopping'],
    integratedWithTeam: [{ id: crypto.randomUUID(), format: 'fullPitchMatch', number: 'gkPlus11vs11PlusGk', space: 'fullFieldSpace', time: 'dur_30min' }],
  },
  'preMatchWarmupActivation': {
    generalObjectives: ['improveOverallHandlingPositioning'],
    warmup: [
      {
        id: crypto.randomUUID(),
        type: 'warmup',
        title: 'neuromuscularActivation',
        objective: 'neuromuscularActivation',
        organization: 'sixYardBoxHurdlesAgilityLadder',
        execution: 'dynamicStretchingGKMovements',
        progression: 'increaseMovementSpeed',
        successCriteria: 'maintainingBalanceSetPosition',
        duration: 'dur_15min',
        intensity: 'medium'
      }
    ],
  },
  'technicalRepertoire': {
    generalObjectives: ['improveOverallHandlingPositioning'],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'figure8FootworkCatch',
        objective: 'improveBasicHandlingHandEyeCoordination',
        organization: 'sixYardBoxHurdlesAgilityLadder',
        execution: 'gkStartsInCenterMovesThroughCones',
        progression: 'addSecondBallImmediatelyAfterFirstSave',
        successCriteria: 'firmCatchWithoutRebounds',
        duration: 'dur_15min',
        intensity: 'medium',
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'volleyCatchesFootwork',
        objective: 'developQuickFootworkOptimalPositioning',
        organization: 'smallGoalOneServerFiveBalls',
        execution: 'gkPerformsLadderFootworkThenDives',
        progression: 'increaseShotSpeedHurdle',
        successCriteria: 'maintainingBalanceSetPosition',
        duration: 'dur_15min',
        intensity: 'medium',
      }
    ]
  },
  'standaloneDrills': {
    generalObjectives: ['improveOverallHandlingPositioning'],
    exercises: [
      {
        id: crypto.randomUUID(),
        type: 'warmup',
        title: 'warmupMobilityActivation',
        objective: 'prepareMusclesExplosive',
        organization: 'sixYardBoxHurdlesAgilityLadder',
        execution: 'dynamicStretchingLightHandling',
        progression: 'increaseShotSpeed',
        successCriteria: 'maintainingBalanceSetPosition',
        duration: 'dur_15min',
        intensity: 'medium'
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'lowShotHandlingVolleys',
        objective: 'enhanceReactionSpeedCloseRangeShots',
        organization: 'smallGoalOneServerFiveBalls',
        execution: 'gkPerformsLadderFootworkThenDives',
        progression: 'increaseVolleySpeedLateral',
        successCriteria: 'cleanCatchNoDrops',
        duration: 'dur_15min',
        intensity: 'medium'
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'lateralDivesCentralShots',
        objective: 'focusSetPositionDiving',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'serverShootsFromEdgeSaves',
        progression: 'increaseShotSpeedHurdle',
        successCriteria: 'cleanSaveParrySafe',
        duration: 'dur_20min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'uncontestedHighCrosses',
        objective: 'developTimingTrajectoryReadingConfidence',
        organization: 'fullGoalTwoWingersCrossing',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'increaseDistanceAngleCrossShot',
        successCriteria: 'attackingBallAtHighestPoint',
        duration: 'dur_20min',
        intensity: 'medium'
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'aerialDominanceWithPressure',
        objective: 'developTimingTrajectoryReadingConfidence',
        organization: 'penaltyAreaMannequinsSimulatingTraffic',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'firmCatchWithoutRebounds',
        duration: 'dur_20min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'distributionShortLong',
        objective: 'increaseDistributionRangeAccuracyFeet',
        organization: 'fullPitchTargetsAt30m50m70m',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'requireSpecificDistributionType',
        successCriteria: 'cleanDistributionReachingTargetZone',
        duration: 'dur_15min',
        intensity: 'medium'
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'buildupUnderPressure',
        objective: 'increaseDistributionRangeAccuracyFeet',
        organization: 'oneVOneZoneBoxEdgeToGoal',
        execution: 'serverPlaysThroughBallGkMustDecide',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'correctDecisionMaking90Percent',
        duration: 'dur_20min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'shotStoppingReactions',
        objective: 'enhanceReactionSpeedCloseRangeShots',
        organization: 'penaltyAreaMannequinsSimulatingTraffic',
        execution: 'serverShootsThroughMannequins',
        progression: 'reduceReactionTimeDistanceShot',
        successCriteria: 'cleanSaveParrySafe',
        duration: 'dur_15min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'doubleSavesRecovery',
        objective: 'improveAbilityRecoverQuicklySecondarySaves',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'gkMakesInitialDivingSaveQuicklyRecovers',
        progression: 'addSecondBallImmediatelyAfterFirstSave',
        successCriteria: 'noReboundsConcededDangerousAreas',
        duration: 'dur_20min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'tacticalPositioningScenario',
        objective: 'enhanceDecisionMakingSweeperKeeper',
        organization: 'oneVOneZoneBoxEdgeToGoal',
        execution: 'serverPlaysThroughBallGkMustDecide',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'correctDecisionMaking90Percent',
        duration: 'dur_20min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'shotStopping',
        title: 'topCornerExtensionDives',
        objective: 'buildExplosiveLegPower',
        organization: 'penaltyAreaOneCoachTenBalls',
        execution: 'serverShootsFromEdgeSaves',
        progression: 'increaseShotSpeed',
        successCriteria: 'cleanSaveParrySafe',
        duration: 'dur_15min',
        intensity: 'high'
      },
      {
        id: crypto.randomUUID(),
        type: 'oneVsOne',
        title: 'overarmThrowsRollsUnderPressure',
        objective: 'improveQuickDistributionHands',
        organization: 'fullPitchTargetsAt30m50m70m',
        execution: 'gkClaimsCrossAtHighestPoint',
        progression: 'introduceActivePressureFromStriker',
        successCriteria: 'cleanDistributionReachingTargetZone',
        duration: 'dur_15min',
        intensity: 'medium'
      }
    ]
  }
};
