---
layout: page
title: "InfraNet: An Ensemble Approach for Real-time Wildlife Detection using Infrared Thermal Imaging"
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
  This project aimed to develop real-time elephant detection system through the use of infrared thermal data for the mitigation of human-elephant conflicts prevelant in various parts of India. We collected and annotated 50,694 thermal frames with humans, elephants, and other animals across varied field conditions with temperatures, occlusions, and foliage. To improve recall performance of the challenging dataset, we evaluated the impact of various preprocessing techniques on the input thermal frames. 
  
  We found that inversion and bilateral filtering were the most effective techniques, improving contrast and reducing noise, respectively. Combining these techniques yielded even stronger results. Ultimately, we devised an ensemble approach to aggregate predictions from four preprocessed variants with a moderate-sized pretrained model, YOLOv8m, increasing elephant recall on the dataset from 0.35 to 0.62, striking a balance between improved recall and fast inference latency crucial for real-time deployment. 

---

This project aimed to develop real-time elephant detection system using thermal imaging to mitigate human-elephant conflict. 
<!-- Under supervision of my advising professor in my senior year,  -->
We collected and annotated a dataset of 50,694 thermal frames which included instances of humans, elephants, and other animals. The dataset covered varied and challenging environmental conditions, allowing us to test how different modeling choices generalized across settings. 

<figure style="float: left; width: 50%;">
<img src="{{'assets/img/figure1-thermal.png' | relative_url }}" alt="infrared fig 1"
loading="lazy" style="width: 90%; height: auto;">
</figure>

<figure style="float: left; width: 50%;">
<img src="{{'assets/img/elephant_detection_results.png' | relative_url }}" alt="infrared fig 2"
loading="lazy" style="width: 100%; height: auto;">
</figure>

Fine-tuning pretrained YOLO models on this noisy dataset initially resulted in overfitting and poor recall in specific test locations. To address this, we systematically evaluated the impact of various preprocessing techniques on the input thermal frames. we found that inversion and bilateral filtering were the most effective techniques, improving contrast and reducing noise, respectively. Combining these techniques yielded even stronger results. Ultimately, we devised an ensemble approach using four preprocessed variants with a moderate size pretrained YOLOv8m model, increasing elephant recall on the dataset from 0.35 to 0.62, striking a balance between improved recall and fast inference latency crucial for real-time deployment.

<!-- 
  InfraNet is my undergraduate research project on real-time elephant detection from infrared thermal imagery for human-wildlife conflict mitigation. The work uses a 50,694-frame thermal dataset with humans, elephants, and other animals across varied field conditions, then studies how preprocessing choices affect detector robustness.

  The final approach combined four preprocessed thermal variants with a lightweight pretrained YOLO detector. Inversion and bilateral filtering were especially useful, and the ensemble improved elephant recall from 0.35 to 0.62 while preserving the fast inference profile needed for edge deployment. The paper was published at IEEE AVSS 2025.
-->

<!-- 
InfraNet studies wildlife detection in thermal imagery, with elephant detection as the central safety-critical case. The motivation is practical: thermal cameras can operate when visible-light imagery is unreliable, but field footage introduces noise, contrast variation, and domain shifts that can hurt recall.

I worked with a 50,694-frame annotated dataset covering humans, elephants, and other animals. Fine-tuning pretrained YOLO models directly on the raw thermal frames exposed poor recall in some test locations, so I evaluated preprocessing strategies before detection. Inversion helped contrast, bilateral filtering reduced noise while retaining edges, and combining several preprocessed views gave the model a broader signal than a single thermal rendering.

The final ensemble used four preprocessed variants with a lightweight pretrained detector and improved elephant recall from **0.35 to 0.62**. The goal was not only higher recall, but a practical balance between detection quality and inference speed for real-time deployment.
-->

The paper is available for reading **[here]({{ '/assets/pdf/InfraNet%20-%20AVSS%202025.pdf' | relative_url }})**. Our work was published in IEEE AVSS 2025, and is available here at [IEEE Xplore](https://ieeexplore.ieee.org/document/11149967). The code implementation is available here in the [repository](https://github.com/djdhillxn/infrared/tree/pipeline). I am fortunate for the supervision of [Prof. Vinod Pankajakshan](https://iitr.ac.in/Departments/Electronics%20and%20Communication%20Engineering%20Department/People/Faculty/100564.html) on this work, and more, at the
Department of Electronics and Communication Engineering, IIT Roorkee. This work was my senior year undergraduate B.Tech project.




<figure style="float: left; width: 100%;">
<img src="{{'assets/img/table1-thermal.png' | relative_url }}" alt="trpo fig 2"
loading="lazy" style="width: 100%; height: auto;">
</figure>

<figure style="float: left; width: 100%;">
<img src="{{'assets/img/table2-thermal.png' | relative_url }}" alt="trpo fig 3"
loading="lazy" style="width: 100%; height: auto;">
</figure>


.
