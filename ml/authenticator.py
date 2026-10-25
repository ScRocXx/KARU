"""Unified Karu Textile Authenticator.

Combines Deep Metric Learning (Micro-Texture Analysis) with Vision-Language Reasoning
to produce a complete verification verdict for Indian handloom textiles.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional
from PIL import Image

from ml.config import AuthenticatorConfig
from ml.models.textile_metric_net import TextileMetricAnalyzer, MetricAnalysisResult
from ml.models.textile_vlm import TextileVLMReasoner, VLMAnalysisResult


@dataclass
class AuthenticityReport:
    """Final authenticity evaluation for a textile piece."""
    verdict: str                        # "Karu Verified Handmade" | "Unverified / Powerloom Replica"
    authenticity_score: float           # 0.0 to 100.0
    is_authentic_handloom: bool
    confidence_level: str               # "High", "Moderate", "Low"
    craft_type: str
    
    # Detailed sub-scores
    micro_texture_score: float
    tension_irregularity: float
    slub_density_entropy: float
    synthetic_sheen_index: float
    vlm_semantic_score: float
    
    # Evidence & Cues
    cues_for: List[str]
    cues_against: List[str]
    technical_summary: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
        
    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


class KaruTextileAuthenticator:
    """
    Main entry point for authenticating handloom vs synthetic textiles.
    Completely decoupled from the web & API server so it can be run
    standalone or integrated as an ML worker.
    """
    def __init__(self, config: Optional[AuthenticatorConfig] = None):
        self.config = config or AuthenticatorConfig()
        self.metric_analyzer = TextileMetricAnalyzer(embedding_dim=self.config.embedding_dim)
        self.vlm_reasoner = TextileVLMReasoner()

    def authenticate(
        self,
        image_or_path: str | Image.Image,
        craft_claim: str = "Pure Silk Handloom Saree"
    ) -> AuthenticityReport:
        """
        Executes the dual-engine authentication pipeline.
        """
        if isinstance(image_or_path, str):
            image = Image.open(image_or_path)
        else:
            image = image_or_path

        # 1. Micro-texture metric analysis (Deep Metric Learning)
        metric_res: MetricAnalysisResult = self.metric_analyzer.analyze_image(image)

        # 2. Vision-Language semantic reasoning
        vlm_res: VLMAnalysisResult = self.vlm_reasoner.evaluate(image, claimed_craft=craft_claim)

        # 3. Ensemble Scoring
        combined_score = (
            (metric_res.handmade_confidence * self.config.metric_texture_weight) +
            (vlm_res.semantic_handmade_probability * self.config.semantic_vlm_weight)
        )
        
        # Penalize if excessive synthetic sheen is detected
        if metric_res.synthetic_sheen_index > self.config.sheen_synthetic_ceiling:
            combined_score *= 0.65

        final_score_100 = round(combined_score * 100.0, 1)
        is_authentic = final_score_100 >= (self.config.authenticity_threshold * 100.0)

        # Determine verdict
        if is_authentic:
            verdict = "Karu Verified Handmade"
            confidence = "High" if final_score_100 >= 80 else "Moderate"
            summary = (
                f"Authentic handloom signatures confirmed. Structural analysis shows natural human tension "
                f"irregularity ({metric_res.tension_irregularity_score}) and organic yarn slubs without "
                f"synthetic specular reflections."
            )
        else:
            verdict = "Unverified / Powerloom Replica"
            confidence = "High" if final_score_100 <= 50 else "Moderate"
            summary = (
                f"Micro-texture indicates mechanical perfection and uniform warp/weft spacing typical of "
                f"industrial powerlooms. Synthetic sheen index ({metric_res.synthetic_sheen_index}) suggests "
                f"synthetic filament blend."
            )

        cues_for = list(vlm_res.cues_for_handmade)
        if metric_res.tension_irregularity_score > 0.4:
            cues_for.append(f"Measured natural weft tension variance: {metric_res.tension_irregularity_score}")
        if metric_res.slub_entropy > 0.5:
            cues_for.append(f"Organic yarn slub distribution entropy: {metric_res.slub_entropy}")

        cues_against = list(vlm_res.cues_against_handmade)
        if metric_res.synthetic_sheen_index > 0.5:
            cues_against.append(f"Elevated specular reflectance index: {metric_res.synthetic_sheen_index}")
        if metric_res.tension_irregularity_score < 0.2:
            cues_against.append("Absence of human weave irregularities (mechanical uniformity)")

        return AuthenticityReport(
            verdict=verdict,
            authenticity_score=final_score_100,
            is_authentic_handloom=is_authentic,
            confidence_level=confidence,
            craft_type=craft_claim,
            micro_texture_score=round(metric_res.handmade_confidence * 100, 1),
            tension_irregularity=metric_res.tension_irregularity_score,
            slub_density_entropy=metric_res.slub_entropy,
            synthetic_sheen_index=metric_res.synthetic_sheen_index,
            vlm_semantic_score=round(vlm_res.semantic_handmade_probability * 100, 1),
            cues_for=cues_for,
            cues_against=cues_against,
            technical_summary=summary
        )
