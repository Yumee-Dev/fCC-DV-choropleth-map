const getData = (source) => {
    return fetch(source)
        .then((response) => response.json())
        .catch((error) => console.log(error));
};

(async function processData() {
    // load data
    const geo = await getData(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
    );
    const educations = await getData(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
    );

    // define color scale
    const [minEd, maxEd] = d3.extent(educations, (d) => d.bachelorsOrHigher);
    const colorScale = d3
        .scaleThreshold()
        .domain(d3.range(minEd, maxEd, (maxEd - minEd) / 6))
        .range(d3.schemePurples[7]);

    // form legend
    const legendSvg = d3.select("#legend");
    const width = document.querySelector("#legend").clientWidth - 20;
    const height = document.querySelector("#legend").clientHeight;
    const legendScale = d3.scaleLinear().domain([minEd, maxEd]).range([0, width]);
    const legendAxis = d3
        .axisBottom(legendScale)
        .tickValues([...d3.range(minEd, maxEd, (maxEd - minEd) / 6), maxEd])
        .tickSize(20)
        .tickFormat((l) => Math.round(l) + "%");
    colorScale.domain().forEach((value) => {
        legendSvg
            .append("rect")
            .attr("x", legendScale(value) + 10)
            .attr("y", 20)
            .attr("width", width / 6)
            .attr("height", 12)
            .attr("fill", colorScale(value));
    });
    legendSvg
        .append("g")
        .attr("transform", `translate(10, 20)`)
        .attr("id", "legend-axis")
        .call(legendAxis)
        .select(".domain")
        .remove();

    // form map
    const svg = d3.select("#canvas");
    const path = d3.geoPath();
    svg
        .selectAll("path")
        .data(topojson.feature(geo, geo.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", (d) =>
            colorScale(
                educations.filter((county) => county.fips === d.id)[0].bachelorsOrHigher
            )
        )
        .attr("data-fips", (d) => d.id)
        .attr(
            "data-education",
            (d) =>
                educations.filter((county) => county.fips === d.id)[0].bachelorsOrHigher
        )
        .attr("class", "county")

        // show tooltip on county:hover
        .on("mouseover", (event, d) => {
            const educationsElement = educations.filter(
                (county) => county.fips === d.id
            )[0];
            const tooltip = d3.select("#tooltip");
            tooltip
                .style("display", "block")
                .style("left", event.layerX + 20 + "px")
                .style("top", event.layerY - 20 + "px")
                .html(
                    `${educationsElement.area_name}, ${educationsElement.state
                    }: ${Math.round(educationsElement.bachelorsOrHigher)}%`
                )
                .attr("data-education", educationsElement.bachelorsOrHigher);
        })
        .on("mouseout", (event, d) => {
            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "none");
        });
})();