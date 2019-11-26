var margin = { top: 40, right: 150, bottom: 35, left: 50 };

var width = 1050 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const layers = ["principal", "interest"];

var colors = d3.scaleOrdinal()
    .domain(layers)
    .range(["#e45f52", "#a83e67"]);

//define x and y axes
{
    var x = d3.scaleBand().rangeRound([0, width]).padding(0.05);
    var y = d3.scaleLinear().rangeRound([height, 0]);

    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(5)
        .tickSize(-width,-30,0)
        .tickFormat(d => d3.format("$,.2f")(d));

    var xAxis = d3.axisBottom()
        .scale(x)
        .tickFormat(d => d);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
}


function initialLoad() {
    var loan = get_loan_data();
    drawLegend();
    createChart(loan);
    createTable(loan);
    updateStats(loan);

}

function update() {
    var loan = get_loan_data();
    updateChart(loan);
    updateTable(loan);
    updateStats(loan);
}

function get_loan_data() {
    var payment = +document.getElementById('payment_input').value;
    var interest = +document.getElementById("interest_input").value / 100;
    var loan = [];

    loan.push({ payment_n: 0, principal: 0, interest: 0, balance: +document.getElementById("loan_input").value });
    i = 0
    while (loan[i]["balance"] > 0) {
        i++;
        loan.push({ payment_n: i, principal: 0, interest: 0, balance: 0 });
        loan[i]["interest"] = (interest / 12) * loan[i - 1]["balance"];
        if (payment <= loan[i]["interest"]) {
            alert("Your payment is too small. The interest is accumulating faster than the payment and the loan will never be repayed.\nPlease try again");
            location.reload();
        } else if (payment < (loan[i - 1]["balance"] + loan[i]["interest"])) {
            loan[i]["principal"] = payment - loan[i]["interest"];
            loan[i]["balance"] = loan[i - 1]["balance"] - payment + loan[i]["interest"];
        }
        else {
            loan[i]["principal"] = loan[i - 1]["balance"] - loan[i]["interest"];
            loan[i]["balance"] = 0;
        }

    }
    loan.shift();
    return loan;
};

function drawLegend() {
    var legend = svg.selectAll(".legend")
        .data(layers)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) { return "translate(30," + i * 19 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => colors(d));

    legend.append("text")
        .attr("x", width + 5)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
}

function createChart(loan) {
    var stack = d3.stack()
        .keys(layers)
        .value((d, key) => d[key])
        (loan);

    x.domain(loan.map(d => d.payment_n));
    y.domain([0, d3.max(stack, d => d3.max(d, d => d[1]))]);

    svg.select(".x.axis")
        .transition() // change the x axis
        .duration(500)
        .call(xAxis);
    svg.select(".y.axis") // change the y axis
        .transition()
        .duration(500)
        .call(yAxis);

    var groups = svg.selectAll("g.amount")
        .data(stack)
        .enter()
        .append("g")
        .attr("class", "amount")
        .style("fill", d => colors(d.key));

    groups.selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.payment_n))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function () { tooltip.style("display", null); })
        .on("mouseout", function () { tooltip.style("display", "none"); })
        .on("mousemove", function (d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 30;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(d3.format("$,.2f")(d[1] - d[0]));
        });

    tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");

    tooltip.append("rect")
        .attr("width", 60)
        .attr("height", "1.2em")
        .attr("fill", "white")
        .style("opacity", 0.5)
        .attr("transform", "translate(" + -15 + ",0)");

    tooltip.append("text")
        .attr("x", 15)
        .attr("dy", "1em")
        .attr("text-anchor", "middle");
}

function updateChart(loan) {
    var stack = d3.stack()
        .keys(layers)
        .value((d, key) => d[key])
        (loan);

    x.domain(loan.map(d => d.payment_n));
    y.domain([0, d3.max(stack, d => d3.max(d, d => d[1]))]);

    svg.select(".x.axis")
        .transition() // change the x axis
        .duration(500)
        .call(xAxis);
    svg.select(".y.axis") // change the y axis
        .transition()
        .duration(500)
        .call(yAxis);

    var groups = svg.selectAll("g.amount")
        .data(stack);

    groups.enter()
        .append("g")
        .attr("class", "amount")
        .style("fill", d => colors(d.key));

    var rect = groups.selectAll("rect")
        .data(d => d);

    rect.enter()
        .append("rect")
        .attr("x", d => x(d.data.payment_n))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function () { tooltip.style("display", null); })
        .on("mouseout", function () { tooltip.style("display", "none"); })
        .on("mousemove", function (d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 30;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(d3.format("$,.2f")(d[1] - d[0]));
        });

    rect.transition().duration(500)
        .attr("x", d => x(d.data.payment_n))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    groups.exit().remove();
    rect.exit().remove();
};

function createTable(loan) {
    table = d3.select('#infotable').append('table');
    column_names = ["payment_n", "principal", "interest", "balance"]
    table.append('thead').append('tr')
        .selectAll('th')
        .data(column_names).enter()
        .append('th')
        .text(d => d);
    table.append('tbody')

    rows = table.select("tbody").selectAll('tr')
        .data(loan, d => d.payment_n)
        .enter()
        .append('tr');

    row_entries = rows.selectAll('td')
        .data(function (d) {
            return column_names.map(function (k) {
                if (k == 'payment_n') {
                    return { 'value': d[k], 'name': k };
                }
                else {
                    return { 'value': d3.format("$,.2f")(d[k]), 'name': k };
                }
            });
        }).enter()
        .append('td')
        .text((d) => d.value);
}

function updateTable(loan) {

    rows = table.select("tbody").selectAll('tr')
        .data(loan, d => d.payment_n)

    rows.enter()
        .append('tr');

    rows.exit().remove();

    row_entries = table.select("tbody").selectAll('tr').selectAll('td')
        .data(function (d) {
            return column_names.map(function (k) {
                if (k == 'payment_n') {
                    return { 'value': d[k], 'name': k };
                }
                else {
                    return { 'value': d3.format("$,.2f")(d[k]), 'name': k };
                }
            });
        })
        .text((d) => d.value);

    row_entries.enter()
        .append('td')
        .text((d) => d.value);

}

function updateStats(loan) {
    var total_interest = +d3.sum(loan.map(function (d) { return d.interest; }))

    document.getElementById('payment_time').innerHTML = d3.max(loan.map(function (d) { return d.payment_n; }));
    document.getElementById('loan_amount').innerHTML = d3.format("$,.2f")(document.getElementById('loan_input').value);
    document.getElementById('interest_amount').innerHTML = d3.format("$,.2f")(total_interest);
    document.getElementById('total_amount').innerHTML = d3.format("$,.2f")((total_interest + (+document.getElementById('loan_input').value)));
}

initialLoad();
