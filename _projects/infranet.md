---
layout: page
title: "InfraNet: Real-time Wildlife Detection from Thermal Imagery"
description: "Thermal elephant detection and edge deployment for human-wildlife conflict mitigation"
github: "https://github.com/djdhillxn/infrared/tree/pipeline"
category: Computer Vision
portfolio_order: 40
portfolio_tags:
  - computer vision
  - thermal imaging
  - object detection
  - edge AI
  - YOLO
portfolio_image: assets/img/elephant_detection_results.png
portfolio_image_alt: Elephant detection results from thermal-imaging research
portfolio_summary: |
  InfraNet is my undergraduate research project on real-time elephant detection from infrared thermal imagery for human-wildlife conflict mitigation. The work uses a 50,694-frame thermal dataset with humans, elephants, and other animals across varied field conditions, then studies how preprocessing choices affect detector robustness.

  The final approach combined four preprocessed thermal variants with a lightweight pretrained YOLO detector. Inversion and bilateral filtering were especially useful, and the ensemble improved elephant recall from 0.35 to 0.62 while preserving the fast inference profile needed for edge deployment. The paper was published at IEEE AVSS 2025.
---


<!-- During my undergraduate studies, I led a research project focused on real-time elephant detection using thermal imaging to mitigate human-elephant conflict. Working under supervision of my advising professor in my final year, we collected and annotated a dataset of 50,694 thermal frames which included instances of humans, elephants, and other animals. The dataset covered varied and challenging environmental conditions, allowing us to test how different modeling choices generalized across settings. Fine-tuning pretrained YOLO models on this noisy dataset initially resulted in overfitting and poor recall in specific test locations. To address this, I systematically evaluated the impact of various preprocessing techniques on the input thermal frames. I found that inversion and bilateral filtering were the most effective techniques, improving contrast and reducing noise, respectively. Combining these techniques yielded even stronger results. Ultimately, I devised an ensemble approach using four preprocessed variants with a lightweight pretrained model, increasing elephant recall on the dataset from 0.35 to 0.62, striking a balance between improved recall and fast inference latency crucial for real-time deployment. -->


InfraNet studies wildlife detection in thermal imagery, with elephant detection as the central safety-critical case. The motivation is practical: thermal cameras can operate when visible-light imagery is unreliable, but field footage introduces noise, contrast variation, and domain shifts that can hurt recall.

I worked with a 50,694-frame annotated dataset covering humans, elephants, and other animals. Fine-tuning pretrained YOLO models directly on the raw thermal frames exposed poor recall in some test locations, so I evaluated preprocessing strategies before detection. Inversion helped contrast, bilateral filtering reduced noise while retaining edges, and combining several preprocessed views gave the model a broader signal than a single thermal rendering.

The final ensemble used four preprocessed variants with a lightweight pretrained detector and improved elephant recall from **0.35 to 0.62**. The goal was not only higher recall, but a practical balance between detection quality and inference speed for real-time deployment.

Read the published **[paper PDF]({{ '/assets/pdf/InfraNet%20-%20AVSS%202025.pdf' | relative_url }})**, view the [IEEE Xplore record](https://ieeexplore.ieee.org/document/11149967), or browse the implementation in the [infrared repository](https://github.com/djdhillxn/infrared/tree/pipeline).

<figure style="float: left; width: 50%;">
<img src="{{'assets/img/figure1-thermal.png' | relative_url }}" alt="trpo fig 1"
loading="lazy" style="width: 90%; height: auto;">
</figure>

<figure style="float: left; width: 50%;">
<img src="{{'assets/img/elephant_detection_results.png' | relative_url }}" alt="trpo fig 1"
loading="lazy" style="width: 100%; height: auto;">
</figure>

<figure style="float: left; width: 100%;">
<img src="{{'assets/img/table1-thermal.png' | relative_url }}" alt="trpo fig 2"
loading="lazy" style="width: 100%; height: auto;">
</figure>

<figure style="float: left; width: 100%;">
<img src="{{'assets/img/table2-thermal.png' | relative_url }}" alt="trpo fig 3"
loading="lazy" style="width: 100%; height: auto;">
</figure>


.
