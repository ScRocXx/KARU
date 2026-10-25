"""Configuration parameters for Karu Textile ML Models."""

from dataclasses import dataclass, field
from typing import Dict, List

# Regional Textile Classes from Assam Handloom Research (Das et al., 2024)
TARGET_TEXTILE_CLASSES = [
    "pure_muga",       # Authentic wild golden silk (Handloom)
    "pure_pat",        # Authentic mulberry silk (Handloom)
    "kesa_pat",        # Raw natural silk (Handloom)
    "nuni_pat",        # Traditional handloom silk
    "toss_muga",       # Tussar / synthetic filament blend (Powerloom replica)
    "dry_toss_muga",   # High-speed machine woven imitation
    "powerloom_poly",  # Synthetic polyester replica
]

GENUINE_HANDLOOM_CLASSES = {"pure_muga", "pure_pat", "kesa_pat", "nuni_pat"}
REPLICA_CLASSES = {"toss_muga", "dry_toss_muga", "powerloom_poly"}

@dataclass
class AuthenticatorConfig:
    """Hyperparameters for textile authentication."""
    # Metric Embedding parameters
    embedding_dim: int = 128
    triplet_margin: float = 0.5
    
    # Decision Thresholds
    authenticity_threshold: float = 0.70  # >= 70% is verified handmade
    irregularity_floor: float = 0.25      # Micro-variance below this indicates machine perfection
    sheen_synthetic_ceiling: float = 0.75  # High specular sheen indicates polyester
    
    # Weights for ensemble scoring
    metric_texture_weight: float = 0.60
    semantic_vlm_weight: float = 0.40
    
    # Image preprocessing
    target_image_size: tuple = (512, 512)
    crop_patches: int = 4
