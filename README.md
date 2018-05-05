# HorseFly: Coordinated logistics with a truck and a drone
## Description
[Demo Link](https://cg.ankitaggarwal.me)
Consider a delivery system where a moving truck (with packages) and a drone are autonomously coordinating to deliver the packages in the customer homes. The truck is moving along a predefined path on a map while a drone picks up one package at a time from the truck, delivers it to a customer, and returns to the truck to pick up the next package.

Our goal is to explore the heuristics and define an algorithm using computational geometry to deliver all of the given packages in the minimum time possible. Another goal is to build a visually appealing web application of an interactive visualization of the animated path of the drone and truck completing a set of deliveries.

## Motivation
This project was a part of the graduate course on Computational Geometry by Prof. Joe Mitchell.

## Algorithm
- Compute the clusters of homes using OPTICS density clustering (a heuristic is to choose a neighbourhood size for clustering) and get the number of clusters that can be formed.
- Since OPTICS clustering might leave some homes out of clusters as outliers, therefore, KMeans clustering is used with the number of clusters as found before by the OPTICS algorithm.
- Find the nearest neighbour of the centroid of these clusters to the truck path using kdTrees to decide the pausing points of the truck.
- Construct a schedule for the truck and the drone to complete the delivery in approximately minimum time.

## Implementation
- The implementation of the project as an interactive web-application was done using the Canvas functionality of HTML5, CSS and JavaScript.
- [Density Clustering JavaScript library](https://github.com/uhho/density-clustering/) is used for implementation of OPTICS and KMeans clustering algorithms.
- [kdTree JavaScript library](https://github.com/ubilabs/kd-tree-javascript) is used for the implementation of kdTree data structure for nearest neighbour search.

## Future Work
- Add a random schedule to the application in order to have a comparison.
- Explore other heuristics like size of clusters and ratio of the speed of truck and drone.
- Make the system more dynamic in the sense that the path is not decided before the delivery begins, this will be more robust to disturbances along the path.

## Author
Ankit Aggarwal
