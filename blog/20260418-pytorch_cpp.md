# [Announcement] PyTorch C++ Sample Programs

I have written a lot of PyTorch C++ sample programs, so I’d like to share them here!

Repository: https://github.com/koba-jon/pytorch_cpp

## 1. Repository Overview

This repository reimplements major deep learning models using the PyTorch C++ API (LibTorch), aiming for research and production environments that do **not** depend on Python.

It is a practical collection of implementations for people who want to complete everything in C++—including real-world applications, manufacturing sites, and inference servers.

![PyTorch C++ repository overview](../images/pytorch_cpp.png)

## 2. Implemented Models

### Multiclass Classification
- **AlexNet** (NeurIPS 2012)
- **VGGNet** (ICLR 2015)
- **ResNet** (CVPR 2016)
- **Discriminator** (ICLR 2016)
- **EfficientNet** (ICML 2019)
- **Vision Transformer (ViT)** (ICLR 2021)

### Dimensionality Reduction
- **Autoencoder**
  - AE1d
  - AE2d
- **Denoising Autoencoder**
  - DAE2d

### Generative Modeling
- **Variational Autoencoder (VAE)**
  - VAE2d
- **Wasserstein Autoencoder (WAE)**
  - WAE2d GAN
  - WAE2d MMD
- **VQ-VAE**
- **VQ-VAE-2**
- **DCGAN**
- **Normalizing Flows**
  - Planar Flow2d
  - Radial Flow2d
  - Real-NVP2d
  - Glow
- **Diffusion Models**
  - DDPM2d
  - DDPM2d-v
  - DDIM2d
  - DDIM2d-v
  - PNDM2d
  - PNDM2d-v
  - LDM
  - LDM-v
- **Flow Matching**
  - FM2d
  - RF2d
- **Autoregressive Models**
  - PixelCNN-Gray
  - PixelCNN-RGB
  - PixelSNAIL-Gray
  - PixelSNAIL-RGB

### Image-to-Image Translation
- **U-Net (Regression)**
- **Pix2Pix**
- **CycleGAN**

### Semantic Segmentation
- **SegNet**
- **U-Net (Classification)**

### Object Detection
- **YOLOv1**
- **YOLOv2**
- **YOLOv3**
- **YOLOv5**
- **YOLOv8**

### Representation Learning
- **SimCLR**
- **Masked Autoencoder (MAE)**

### Anomaly Detection
- **AnoGAN2d**
- **DAGMM2d**
- **EGBAD2d**
- **GANomaly2d**
- **Skip-GANomaly2d**

## 3. For Those Who Want to Run It Right Away

Required libraries:
`LibTorch`, `OpenCV`, `OpenMP`, `Boost`, `Gnuplot`, `libpng/png++/zlib`

For LibTorch installation instructions, see:
https://qiita.com/koba-jon/items/2b15865f5b4c0c9fbbf7

### 1) Clone

```bash
$ git clone https://github.com/koba-jon/pytorch_cpp.git
$ cd pytorch_cpp
$ sudo apt install g++-8
```

### 2) Run

#### (1) Move to a target directory (example: AE1d)

```bash
$ cd Dimensionality_Reduction/AE1d
```

#### (2) Build

```bash
$ mkdir build
$ cd build
$ cmake ..
$ make -j4
$ cd ..
```

#### (3) Configure dataset (example dataset: Normal Distribution Dataset)

```bash
$ cd datasets
$ git clone https://github.com/koba-jon/normal_distribution_dataset.git
$ ln -s normal_distribution_dataset/NormalDistribution ./NormalDistribution
$ cd ..
```

#### (4) Train

```bash
$ sh scripts/train.sh
```

#### (5) Test

```bash
$ sh scripts/test.sh
```

Did it run successfully?

Other models should also work with similar steps.
If you run into anything, feel free to leave a comment.

---

Original Japanese article:
https://qiita.com/koba-jon/items/c262dec48f19fd89dea3
