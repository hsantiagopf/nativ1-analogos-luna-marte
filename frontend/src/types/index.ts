export type PlanetaryBody = 'MOON' | 'MARS';

export interface AreaFractionBootstrap {
  median: number;
  p05: number;
  p95: number;
}

export interface RequirementItem {
  cand_area_frac: AreaFractionBootstrap;
  ref_area_frac: AreaFractionBootstrap;
  label: string;
  threshold_deg: number;
  verdict: string;
}

export interface RequirementR03 {
  min_area_frac: number;
  p_pass_cand: number;
  p_pass_ref: number;
  threshold_deg: number;
}

export interface MoonRequirementAssessment {
  method: string;
  R01: RequirementItem;
  R02: RequirementItem;
  R03: RequirementR03;
  R04: RequirementItem;
}

export type RequirementAssessment = MoonRequirementAssessment | string;

export function isMoonRequirementAssessment(
  assessment: RequirementAssessment | undefined
): assessment is MoonRequirementAssessment {
  return typeof assessment === 'object' && assessment !== null && 'R01' in assessment;
}

export interface SlopeDistribution {
  n: number;
  p10: number;
  median: number;
  p90: number;
}

export interface RefReliefSummary {
  sea_frac_masked: number;
  edited_plateau_frac_masked: number;
  valid_frac: number;
  requirement_fractions?: Record<string, number>;
  requirement_scale_m?: number;
  slope_118m?: SlopeDistribution;
  slope_354m?: SlopeDistribution;
  slope_1062m?: SlopeDistribution;
  slope_3186m?: SlopeDistribution;
  slope_463m?: SlopeDistribution;
  slope_1389m?: SlopeDistribution;
  slope_4167m?: SlopeDistribution;
  slope_12501m?: SlopeDistribution;
}

export interface CandidateRanking {
  site_id: string;
  name: string;
  role: 'candidate' | 'validation';
  score_global: number;
  score_global_meaning: string;
  p_top_k_solo_pesos: number;
  expected_rank: number;
  rank_acceptability: number[];
  central_weights: Record<string, number>;
  weighted_distance_deg: { median: number; p05: number; p95: number } | number;
  robustness: 'robusto' | 'sensible al error de medicion';
  scores: {
    inercia_termica: any;
    mineralogia: any;
    relieve_multiescala_distancia_deg: Record<string, number>;
    visual: any;
  };
  scores_note?: string;
  strongest_matches: string[];
  where_it_breaks_down: string[];
  mission_utility: string;
  requirement_assessment: RequirementAssessment;
}

export interface ReferenceRanking {
  ref_site_id: string;
  ref_name: string;
  ref_relief_summary: RefReliefSummary;
  candidates: CandidateRanking[];
}

export interface BodyRankings {
  target_body: PlanetaryBody;
  excluded_by_aridity: string[];
  references: ReferenceRanking[];
}

export interface AllRankingsMeta {
  version: string;
  method: string;
  top_k: number;
  n_iter: number;
  n_noise_replicas: number;
  seed: number;
  weights: string;
  measurement_error: any;
  ranked_dimensions: string[];
  descriptive_dimensions: string[];
  profiles: any;
  language: string;
}

export interface AllRankingsData {
  meta: AllRankingsMeta;
  MOON: BodyRankings;
  MARS: BodyRankings;
}

export interface SiteMetadata {
  site_id: string;
  body: 'MOON' | 'MARS' | 'EARTH';
  role: 'reference' | 'candidate' | 'validation';
  name: string;
  country?: string;
  lat: number;
  lon: number;
  elevation_m?: number;
  aridity_class?: 'hyperarid' | 'arid' | 'semiarid' | 'subhumid';
  aridity_index?: number;
  description: string;
}

export function getHillshadePath(body: PlanetaryBody, siteId: string): string {
  return `/hillshade/${body}_${siteId}.png`;
}
