# -- coding: utf-8 --
import time
import argparse
import cv2
import itertools
import os
import numpy as np
import openface

start = time.time()
np.set_printoptions(precision=2)
# path to openface files
fileDir = os.path.dirname(os.path.realpath(__file__))
modelDir = os.path.join(fileDir, 'models')
dlibModelDir = os.path.join(modelDir, 'dlib')
openfaceModelDir = os.path.join(modelDir, 'openface')

# parser
parser = argparse.ArgumentParser()

parser.add_argument('--img', type=str, help="Input images.")
parser.add_argument('--dlibFacePredictor', type=str, help="Path to dlib's face predictor.",
                    default=os.path.join(dlibModelDir, "shape_predictor_68_face_landmarks.dat"))
parser.add_argument('--networkModel', type=str, help="Path to Torch network model.",
                    default=os.path.join(openfaceModelDir, 'nn4.small2.v1.t7'))
parser.add_argument('--imgDim', type=int,
                    help="Default image dimension.", default=96)
parser.add_argument('--verbose', action='store_true')

args = parser.parse_args()

if args.verbose:
    print("Argument parsing and loading libraries took {} seconds.".format(
        time.time() - start))

start = time.time()
align = openface.AlignDlib(args.dlibFacePredictor)
net = openface.TorchNeuralNet(args.networkModel, args.imgDim)
if args.verbose:
    print("Loading the dlib and OpenFace models took {} seconds.".format(
        time.time() - start))


def get_rep(img_path):
    if args.verbose:
        print("Processing {}.".format(img_path))
    bgr_img = cv2.imread(img_path)
    if bgr_img is None:
        raise Exception("Unable to load image: {}".format(img_path))
    rgb_img = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)

    if args.verbose:
        print("  + Original size: {}".format(rgb_img.shape))

    start = time.time()
    bb = align.getLargestFaceBoundingBox(rgb_img)

    if bb is None:
        raise Exception("Unable to find a face: {}".format(img_path))

    if args.verbose:
        print("  + Face detection took {} seconds.".format(time.time() - start))

    start = time.time()
    aligned_face = align.align(args.imgDim, rgb_img, bb,
                               landmarkIndices=openface.AlignDlib.OUTER_EYES_AND_NOSE)
    if aligned_face is None:
        raise Exception("Unable to align image: {}".format(img_path))
    if args.verbose:
        print("  + Face alignment took {} seconds.".format(time.time() - start))

    return net.forward(aligned_face)


def main():
    d = get_rep(args.img)
    print(d)


if __name__ == '__main__':
    main()
