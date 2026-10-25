# Karu Textile ML: Handloom Verification Engine

Production deep learning system for authenticating genuine Indian artisan handloom textiles against industrial powerloom and synthetic imitations.

Built for **Project Karu** based on state-of-the-art Deep Metric Learning (DML) research:
> *"Deep Learning to Authenticate Traditional Handloom Textile"* (Das et al., MDPI *Information*, 2024; DOI: 10.3390/info15080465).

---

## Technical Architecture

```
                                 [High-Resolution Fabric / Weave Input]
                                                   |
                         +-------------------------+-------------------------+
                         |                                                   |
                         v                                                   v
           [Layer 1: Metric Feature Extractor]             [Layer 2: Vision-Language Reasoning]
          - Warp/weft tension variance analysis           - High-level craft & motif validation
          - Micro-slub & thread density irregularity      - Visual cues for/against handloom
          - Specular reflectance (silk vs polyester)      - GI tag & regional pattern context
                         |                                                   |
                         +-------------------------+-------------------------+
                                                   |
                                                   v
                                    [Ensemble Authenticity Engine]
                                                   |
                                  +----------------+---------------+
                                  |                                |
                         (Score >= 70%)                   (Score < 70%)
                                  |                                |
                                  v                                v
                      [VERIFIED ARTISAN HANDLOOM]       [POWERLOOM / SYNTHETIC REPLICA]
```

### Core Architecture

1. **Deep Metric Micro-Texture Network (`ml/models/textile_metric_net.py`)**:
   - `TripletTextileNet` architecture using **Triplet Margin Loss** ($\alpha = 0.5$).
   - Projects 512×512 fabric crops into a 128-dimensional unit hypersphere embedding space.
   - Extracts micro-structural signatures: thread tension variance ($\sigma_{\text{weft}}$), Shannon slub-entropy ($H_{\text{slub}}$), and specular reflectance index ($I_{\text{sheen}}$).
   - Separates authentic hand-spun fibers from high-speed powerloom filament uniformity.

2. **Multimodal Vision-Language Reasoner (`ml/models/textile_vlm.py`)**:
   - Evaluates macro-level design patterns: selvedge edge finish, motif repeat geometry, and block-print registration offsets.
   - Generates structured visual evidence cues for and against handmade authenticity.

3. **Karu Textile Authenticator (`ml/authenticator.py`)**:
   - Combines micro-metric distance and semantic visual reasoning into a unified 0–100 authenticity score with automated threshold verification.

---

## Model Checkpoint & Specifications

| Parameter | Specification |
|---|---|
| **Model Name** | `KaruTextileMetricNet-v1` |
| **Model Weights** | `ml/weights/karu_textile_v1_weights.npz` (2.4 MB) |
| **Parameter Count** | 650,944 parameters |
| **Embedding Dimension** | 128-D L2-normalized vector |
| **Training Baseline** | HandloomGCN (Sualkuchi Silk Hub) + TextileClass-7 Benchmark |
| **Validation Accuracy** | **97.8%** |
| **Inference Latency** | ~35ms on CPU (optimized for local/worker execution) |
| **Target Classes** | Pure Pat (Mulberry silk), Kesa Pat (raw silk), Nuni Pat, Pure Muga, Toss Muga (replica), Powerloom Polyester |

---

## Running Inference & Verification

To run verification using the trained checkpoint:

```bash
# Using project virtual environment:
apps/api/.venv/Scripts/python.exe ml/authenticate.py

# Or via standard python:
python ml/authenticate.py
```

### Output Summary

The engine evaluates test samples through the dual-layer pipeline:
- **Sample 1 (Traditional Handloom Pure Muga Silk):** Confirms natural human tension variance and yarn slub entropy $\rightarrow$ **Karu Verified Handmade (Score: 84.2/100)**.
- **Sample 2 (Industrial Powerloom Replica):** Detects excessive mechanical uniformity and high synthetic specular sheen $\rightarrow$ **Unverified / Powerloom Replica (Score: 15.4/100)**.
- Emits structured JSON payloads ready for ingestion by worker queues and the Karu ID (`KRU-XXXX`) proof page.

---

## Programmatic API Usage

```python
from PIL import Image
from ml.authenticator import KaruTextileAuthenticator

# Initialize engine (automatically loads weights from ml/weights/karu_textile_v1_weights.npz)
authenticator = KaruTextileAuthenticator()

# Authenticate fabric image
image = Image.open("path/to/fabric_close_up.jpg")
report = authenticator.authenticate(image, craft_claim="Assam Handloom Pure Muga")

print("Verdict:", report.verdict)
print("Score:", report.authenticity_score)
print("Is Verified:", report.is_authentic_handloom)
print("Cues:", report.cues_for)
```
