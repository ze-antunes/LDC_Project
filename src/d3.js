let locationData;
let locations;
let file = "./WW2_LocationData_Clean - GeoBattleData_YZ.csv";

// let widthMap = window.innerWidth,
//     heightMap = window.innerHeight;

// let projectionMap = d3.geoMercator()
//     .center([50, 10]) //long and lat starting position
//     .scale(150) //starting zoom position
//     .rotate([10, 0]); //where world split occurs

// let svgMap = d3
//     .select("mesh.floor")
//     .append("svg")
//     .attr("width", widthMap)
//     .attr("height", heightMap);

// let pathMap = d3.geoPath().projection(projectionMap);

// let gMap = svgMap.append("g");

// // load and display the world and locations
// d3.json(
//     "https://gist.githubusercontent.com/d3noob/5193723/raw/world-110m2.json"
// ).then(function (topology) {
//     let world = gMap
//         .selectAll("path")
//         .data(topojson.feature(topology, topology.objects.countries).features)
//         .enter()
//         .append("path")
//         .attr("d", pathMap)
//         .attr("class", "countries");

//     // Zoom and pan functionality
//     let zoomMap = d3.zoom().on("zoom", function (event) {
//         gMap.attr(
//             "transform",
//             "translate(" +
//             event.transform.x +
//             "," +
//             event.transform.y +
//             ")scale(" +
//             event.transform.k +
//             ")"
//         );
//         gMap.selectAll("path").attr("d", pathMap);
//     });
//     svgMap.call(zoomMap);
// });

let handleRequest = (data) => {
    // console.log(data)
    locationData = data;
    let dates = [];

    // Convert and log dates
    locationData.forEach(function (war) {
        let convertedDates = fractionalYearToDate(war.date);
        dates.push({ date: convertedDates, value: war.duration });
    });

    // Sort the dates array by the 'date' property
    dates.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    // console.log(dates)

    // add war location circles
    // locations = gMap
    //     .selectAll("circle")
    //     .data(locationData)
    //     .enter()
    //     .append("circle")
    //     .attr("class", "location-point")
    //     .attr("cx", function (d) { return projectionMap([d.long, d.lat])[0] })
    //     .attr("cy", function (d) { return projectionMap([d.long, d.lat])[1] })
    //     .attr("r", 1)

    createTimeline(dates)
};

function fractionalYearToDate(fractionalYear) {
    // Reference date
    let referenceYear = Math.floor(fractionalYear);

    // Calculate the year
    let year = Math.floor(fractionalYear);

    // Calculate the day of the year
    let dayOfYear = Math.floor((fractionalYear - year) * 365); // Assuming non-leap year

    // Convert day of year to Date object
    let date = new Date(referenceYear, 0); // January is 0-based
    date.setDate(dayOfYear + 1); // setDate sets the day of the month, adding 1 to dayOfYear since it starts from 0

    // Format the date as yyyy-mm-dd
    let day = date.getDate().toString().padStart(2, "0");
    let month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based

    return year + "-" + month + "-" + day;
}


// --------------------- Timeline

let createTimeline = (data) => {
    // console.log(data)
    // Sample data with dates and corresponding values
    // let data = [
    //     { date: "2024-01-01", value: 20 },
    //     { date: "2024-01-01", value: 10 },
    //     { date: "2024-01-02", value: 35 },
    //     { date: "2024-01-02", value: 11 },
    //     { date: "2024-01-03", value: 15 },
    //     { date: "2024-01-03", value: 29 },
    //     { date: "2024-01-03", value: 25 },
    //     { date: "2024-01-04", value: 20 },
    //     { date: "2024-01-05", value: 35 },
    //     { date: "2024-01-06", value: 15 }
    // ];

    // Parse the date strings into JavaScript Date objects
    let parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(function (d) {
        d.date = parseDate(d.date);
    });

    let widthTimeline = window.innerWidth;

    // Set up SVG and scales
    let svg = d3.select("svg.timeline")
        .attr("width", widthTimeline)
        .attr("height", 100),
        margin = { top: 20, right: 20, bottom: 45, left: 50 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg
            .append("g")
            .attr(
                "transform",
                "translate(" + margin.left + "," + margin.top + ")"
            );

    let x = d3
        .scaleTime()
        .range([0, width])
        .domain(
            d3.extent(data, function (d) {
                return d.date;
            })
        );

    let y = d3
        .scaleLinear()
        .range([height, 0])
        .domain([
            0,
            d3.max(data, function (d) {
                return d.value;
            })
        ]);

    // Define the line function
    // let line = d3
    //     .line()
    //     .x(function (d) {
    //         return x(d.date);
    //     })
    //     .y(function (d) {
    //         return y(d.value);
    //     });

    // // Append the line to the chart
    // let path = g
    //   .append("path")
    //   .datum(data)
    //   .attr("class", "line")
    //   .attr("d", line)
    //   .attr("stroke", "currentColor")
    //   .attr("fill", "none");

    // Calculate the minimum and maximum years from the data
    let minYear = d3.min(data, function (d) { return d.date.getFullYear(); });
    let maxYear = d3.max(data, function (d) { return d.date.getFullYear(); });

    // Create an array to store the ticks
    let ticks = [];

    // Loop through each year from the minimum to maximum
    for (let year = minYear; year <= maxYear; year++) {
        // Loop through each month (0-indexed)
        for (let month = 0; month < 12; month++) {
            // Create a new date for the current year and month
            let date = new Date(year, month);

            // Add the date to the ticks array
            ticks.push(date);
        }
    }

    // Set up timeline axis
    let xAxis = d3.axisBottom(x)
        .tickValues(d3.timeMonths(new Date(1940, 0), new Date(1945, 11))) // Generate ticks for each month from January 1940 to December 1945
        .tickFormat(function (date) {
            // Format ticks to display year and abbreviated month
            let year = date.getFullYear();
            let month = date.getMonth();
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return (month === 0 ? year : '') + ' ' + monthNames[month];
        });

    // Append the x-axis to the chart
    let xAxisGroup = g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Customize tick height and label position
    xAxisGroup.selectAll(".tick line")
        .attr("y2", function (d, i) {
            // Adjust the height of the ticks based on their position
            return i % 12 === 0 ? -17 : -5; // Increase the height for year ticks
        });

    xAxisGroup.selectAll(".tick text")
        .attr("dy", function (d, i) {
            // Adjust the position of the tick labels for year ticks
            return i % 12 === 0 ? -30 : -17; // Move the label lower for year ticks
        });

    // Add an indicator (circle) to represent the current position
    let indicator = g
        .append("circle")
        .attr("class", "indicator")
        .attr("r", 6)
        .style("fill", "red");

    // Add circles to represent data points
    let dataPoints = g
        .selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", function (d) {
            return x(d.date);
        })
        .attr("cy", function (d) {
            return y(0);
        })
        .attr("r", 5);

    // Animate the chart by updating the data and redrawing the line
    function animateChart(index) {
        // Update the indicator position
        indicator
            .transition()
            .duration(transitionDuration)
            .attr("cx", x(data[index].date))
            .attr("cy", height + 25); // Adjust the vertical position as needed

        // Update the data to the next set (you can adjust this logic based on your specific use case)
        // let newData = data.slice(0, index + 1);

        // // Update the line
        // path
        //   .datum(newData)
        //   .transition()
        //   .delay(transitionDuration) // Delay the line transition
        //   .duration(transitionDuration) // Ensure the line transition starts after the indicator movement
        //   .attr("d", line);

        // Show only the data point corresponding to the current index
        dataPoints
            .transition()
            .duration(transitionDuration)
            .style("opacity", function (d, i) {
                return i === index ? 1 : 0;
            });

        // locations
        //     .transition()
        //     .duration(transitionDuration)
        //     .style("opacity", function (d, i) {
        //         return i === index ? 1 : 0;
        //     });

        // Repeat the animation with a loop back to the first element
        setTimeout(function () {
            animateChart((index + 1) % data.length);
        }, transitionDuration);
    }

    // Start the animation
    animateChart(0);
}


// Set up animation transition
let transitionDuration = 2000; // Duration for each transition in milliseconds

// ------ Request Data
d3.csv(file)
    .then(handleRequest);