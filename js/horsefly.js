var c, ctx;
var speed, currentPath, fullPath, pathDrone, f = 0, steps, size = 14, tSize = 18, statusBar;

var dataset = [];
var path = [];

var truck = {
    x: 0.0,
    y: 0.0,
    speed: 0.0
};

var drone = {
    x: 0.0,
    y: 0.0,
    speed: 0.0
};

var plane_img = new Image();
plane_img.src = "img/plane.svg";

var truck_img = new Image();
truck_img.src = "img/truck.svg";

var resetCanvas = function () {
    dataset = [];
    path = [];
    pathDrone = [];
    currentPath = [];
    $(c).unbind("mousedown").unbind("mouseup");
    ctx.clearRect(0, 0, c.width, c.height);
};

var pointLiesBetweenLine = function (point, line) {
    var currPoint = {x: point[0], y: point[1]},
    point1 = {x: line[0][0], y: line[0][1]},
    point2 = {x: line[1][0], y: line[1][1]};
    var dxc = currPoint.x - point1.x;
    var dyc = currPoint.y - point1.y;

    var dxl = point2.x - point1.x;
    var dyl = point2.y - point1.y;

    var cross = dxc * dyl - dyc * dxl;

    if (Math.abs(cross) > 0.1)
        return false;

    if (Math.abs(dxl) >= Math.abs(dyl))
      return dxl > 0 ? 
        point1.x <= currPoint.x && currPoint.x <= point2.x :
        point2.x <= currPoint.x && currPoint.x <= point1.x;
    else
      return dyl > 0 ? 
        point1.y <= currPoint.y && currPoint.y <= point2.y :
        point2.y <= currPoint.y && currPoint.y <= point1.y;
};

// works out the X, Y position of the click inside the canvas from the X, Y position on the page
var getPosition = function (mouseEvent, sigCanvas) {
    var x, y;
    if (mouseEvent.pageX != undefined && mouseEvent.pageY != undefined) {
        x = mouseEvent.pageX;
        y = mouseEvent.pageY;
    } else {
        x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return { X: x - sigCanvas.offsetLeft, Y: y - sigCanvas.offsetTop };
}

var centroid = function (cluster, dataset) {
    var sumX = 0, sumY = 0;
    for (var i = 0; i < cluster.length; i++) {
        sumX += dataset[cluster[i]][0];
        sumY += dataset[cluster[i]][1];
    }
    return [sumX / (cluster.length * 1.0), sumY / (cluster.length * 1.0)];
};

var findClusters = function (dataset, queryRange, minPointsInCluster) {
    var dbscan = new DBSCAN();
    var densityClusters = dbscan.run(dataset, queryRange, minPointsInCluster);
    var kmeans = new KMEANS(); // DBSCAN might not include all points, run KMEANS
    if (densityClusters.length == 0) K = 3;
    else K = densityClusters.length;
    var clusters = kmeans.run(dataset, K);
    return clusters;
};

var getAllPointsOnPath = function (path) {
    var slope = function (a, b) {
        if (a[0] == b[0]) {
            return null;
        }
        return (b[1] - a[1]) / (b[0] - a[0]);
    }

    var intercept = function (point, slope) {
        if (slope === null) {
            return point[0];
        }
        return point[1] - slope * point[0];
    }

    var pathPoints = [];
    path.forEach(function (points) {
        var m = slope(points[0], points[1]);
        var b = intercept(points[0], m);
        for (var x = points[0][0]; x <= points[1][0]; x++) {
            var y = m * x + b;
            pathPoints.push([x, y]);
        }
    });
    return pathPoints;
};

var redrawScene = function () {
    ctx.beginPath();
    fullPath.forEach(function (p) {
        ctx.fillRect(p[0][0] - 2, p[0][1] - 2, 4, 4);
        ctx.fillRect(p[1][0] - 2, p[1][1] - 2, 4, 4);
        ctx.moveTo(p[0][0], p[0][1]);
        ctx.lineTo(p[1][0], p[1][1]);
        ctx.stroke();
    });
    ctx.closePath();
};

var move = function() {
    statusBar.innerHTML = '<b>Status: </b> Delivery in progress!';

    pathDrone = pathDrone.slice(1);
    if (pathDrone.length == 0) {
        statusBar.innerHTML = '<b>Status: </b> Delivery finished!';
        return;
    }
    var path = pathDrone[0]; 
    currentPath = path;
    var start = path[0], end = path[1];
    var dx = end[0] - start[0], dy = end[1] - start[1];
    var dist = Math.abs(Math.sqrt(dx * dx + dy * dy));
    speed = steps / dist;
    draw();
};

var draw = function () {
    ctx.clearRect(drone.x - size * 1.5, drone.y - size * 1.5, size * 3, size * 3);
    ctx.clearRect(truck.x - tSize * 1.5, truck.y - tSize * 1.5, tSize * 3, tSize * 3);
    redrawScene();
    f += speed;
    var start = currentPath[0], end = currentPath[1];
    drone.x = start[0] + (end[0] - start[0]) * f;
    drone.y = start[1] + (end[1] - start[1]) * f;
    if ($.inArray(start, dataset) == -1 && $.inArray(end, dataset) == -1) {
        truck.x = start[0] + (end[0] - start[0]) * f;
        truck.y = start[1] + (end[1] - start[1]) * f;
    }
    if (f < 1) {
        ctx.drawImage(plane_img, drone.x - size, drone.y - size, 2 * size, 2 * size);
        ctx.drawImage(truck_img, truck.x - tSize, truck.y - tSize, 2 * tSize, 2 * tSize);
        requestAnimationFrame(draw);
    } else {
        ctx.drawImage(plane_img, drone.x - size, drone.y - size, 2 * size, 2 * size);
        ctx.drawImage(truck_img, truck.x - tSize, truck.y - tSize, 2 * tSize, 2 * tSize);
        f = 0;
        move();
    }
};

var getPath = function () {
    $(c).unbind("mousedown").unbind("mouseup");
    ctx.moveTo(0, 0);
    ctx.beginPath();
    var start_pt, end_pt;
    $(c).mousedown(function (mouseEvent) {
        var position = getPosition(mouseEvent, c);
        ctx.lineTo(position.X, position.Y);
        ctx.fillRect(position.X - 2, position.Y - 2, 4, 4);
        ctx.stroke();
        if (start_pt == null) {
            start_pt = [position.X, position.Y];
        }
        else {
            end_pt = [position.X, position.Y];
            path.push([start_pt, end_pt]);
            start_pt = end_pt
        }
    }).mouseup(function (mouseEvent) {
        ctx.closePath();
        $(c).unbind("mouseup");
    });
    statusBar.innerHTML = '<b>Status</b>: Next, click on Draw Homes, then click anywhere on the canvas below to draw a \
                            set of points representing homes for delivery.';
};

var getDataset = function () {
    $(c).unbind("mousedown").unbind("mouseup");
    ctx.moveTo(0, 0);
    ctx.beginPath();
    var pt;
    $(c).mousedown(function (mouseEvent) {
        var position = getPosition(mouseEvent, c);
        ctx.fillRect(position.X - 2, position.Y - 2, 4, 4);
        ctx.stroke();
        if (pt != [position.X, position.Y]) {
            pt = [position.X, position.Y];
            dataset.push(pt);
        }
    }).mouseup(function (mouseEvent) {
        ctx.closePath();
        $(c).unbind("mouseup");
    });
    statusBar.innerHTML = '<b>Status</b>: Finally, click on Run! to run the algorithm and see the delivery animation. The algorithm will cluster the homes, \
                            perform a nearest neighbor search and create an approximately optimal path for the truck and drone to deliver all the packages.';
};

var tracePath = function() {
    $(c).unbind("mousedown").unbind("mouseup");
    truck.x = path[0][0][0];
    truck.y = path[0][0][1];
    drone.x = path[0][0][0];
    drone.y = path[0][0][1];

    statusBar.innerHTML = '<b>Status: </b> Clustering delivery home data using DBSCAN/KMeans.';

    var queryRange = 100;
    var minPointsInCluster = 3;
    var clusters = findClusters(dataset, queryRange, minPointsInCluster);
    var centroids = [];
    clusters.forEach(function (cluster) {
        centroids.push(centroid(cluster, dataset));
    });
    var pathPoints = getAllPointsOnPath(path);
    var distance = function(a, b) {
        return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
    };
    var toDict = function (point) {
        return {x: point[0], y: point[1]};
    };

    statusBar.innerHTML = '<b>Status: </b> Performing a nearest-neighbour search using kdTree.';

    var tree = new kdTree(pathPoints.map(toDict), distance, ["x", "y"]);
    var pausePoints = [];
    var clusterToPauseMapping = {};
    centroids.forEach(function (centroid, index) {
        pausePoints.push(tree.nearest(toDict(centroid), 1));
        clusterToPauseMapping[[pausePoints[index][0][0].x, pausePoints[index][0][0].y]] = clusters[index];
    });
    var pauseTimes = [], sumPauseTimes = 0;
    clusters.forEach(function (cluster, index) {
        var dist = Math.sqrt(pausePoints[index][0][1]);
        pauseTimes.push(Math.ceil((cluster.length * dist * 2) / droneSpeed));
        sumPauseTimes += pauseTimes[index];
    });
    var tPath = [];
    var pPoints = [];
    pausePoints.forEach(function (p) {
        pPoints.push([p[0][0].x, p[0][0].y]);
    });
    pPoints.sort(function (a, b) {
        return ((a[0] - b[0]) || (a[0] === b[0] && a[1] - b[1]));
    });

    statusBar.innerHTML = '<b>Status: </b> Deciding an approximate optimal path for drone and truck.';

    path.forEach(function(p) {
        tPath.push(p[0]);
        pPoints.forEach(function (pt) {
            if (pointLiesBetweenLine(pt, p)) {
                tPath.push(pt);
                tPath.push(pt);
            }
        });
        tPath.push(p[1]);
    });

    var _pathDrone = [];
    pathDrone = [];
    while(tPath.length) _pathDrone.push(tPath.splice(0, 2));
    _pathDrone.forEach(function (tP) {
        pathDrone.push(tP);
        if (tP[1] in clusterToPauseMapping) {
            cluster = clusterToPauseMapping[tP[1]];
            cluster.forEach(function (c) {
                pathDrone.push([tP[1], dataset[c]]);
                pathDrone.push([dataset[c], tP[1]]);
            });
        }
    });
    fullPath = pathDrone.map(a => Object.assign([], a));
    pathDrone.unshift([]);
    move();
    ctx.font="20px Georgia";
    ctx.fillText('Time Taken: ~' + sumPauseTimes + ' s', 10, 20);
    ctx.fillText('Drone Speed: ' + droneSpeed + ' m/s', 10, 50);
    ctx.fillText('Truck Speed: ' + truckSpeed + ' m/s', 10, 80);
};

var init = function (droneSpeed, truckSpeed) {
    c = document.getElementById("canvas");
    statusBar = document.getElementById("statusBox");
    statusBar.innerHTML = '<b>Status</b>: Click on Draw Path, then click anywhere on the canvas below to draw the starting point of the path and \
                            then click somewhere else on canvas to draw the ending point, then the next ending point and so on, thus creating a path.';
    c.width = c.clientWidth;
    c.height = c.clientHeight;
    ctx = c.getContext("2d");
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    truck.speed = truckSpeed;
    drone.speed = droneSpeed;
    steps = drone.speed / truck.speed;
}