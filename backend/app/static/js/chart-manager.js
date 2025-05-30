// Chart Manager - Handles response time chart functionality
let responseTimeChart;

function initializeChart() {
  if (!window.chartData || window.chartData.length === 0) {
    console.log("No chart data available, skipping chart initialization");
    return;
  }

  const ctx = document.getElementById("responseTimeChart");
  if (!ctx) {
    console.error("Chart canvas not found");
    return;
  }

  responseTimeChart = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: window.chartData.map((site) => site.name),
      datasets: [
        {
          label: "Response Time (ms)",
          data: window.chartData.map((site) => site.response_time),
          backgroundColor: window.chartData.map((site) =>
            getResponseTimeColor(site.response_time)
          ),
          borderColor: window.chartData.map((site) =>
            site.status.startsWith("OK") ? "transparent" : "#991B1B"
          ),
          borderWidth: window.chartData.map((site) =>
            site.status.startsWith("OK") ? 0 : 2
          ),
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const index = context.dataIndex;
              const site = window.chartData[index];
              return "Status: " + site.status;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            display: true,
          },
          title: {
            display: true,
            text: "Response Time (ms)",
          },
          ticks: {
            callback: function (value) {
              return value + " ms";
            },
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  });

  console.log("Chart initialized successfully");
}

function getResponseTimeColor(responseTime) {
  if (responseTime > 1000) {
    return "#EF4444"; // red for slow responses
  } else if (responseTime > 500) {
    return "#F59E0B"; // amber for medium responses
  } else {
    return "#10B981"; // green for fast responses
  }
}

function updateChart(siteId, data) {
  if (!responseTimeChart || !window.chartData) {
    console.log("Chart not initialized, skipping update");
    return;
  }

  // Find the site in chartData
  const siteIndex = window.chartData.findIndex((site) => site.id === siteId);

  if (siteIndex !== -1) {
    // Update the site data
    window.chartData[siteIndex].response_time = data.response_time;
    window.chartData[siteIndex].status = data.status;

    // Update the chart data for just this site
    responseTimeChart.data.datasets[0].data[siteIndex] = data.response_time;
    responseTimeChart.data.datasets[0].backgroundColor[siteIndex] =
      getResponseTimeColor(data.response_time);
    responseTimeChart.data.datasets[0].borderColor[siteIndex] =
      data.status.startsWith("OK") ? "transparent" : "#991B1B";
    responseTimeChart.data.datasets[0].borderWidth[siteIndex] =
      data.status.startsWith("OK") ? 0 : 2;

    // Update the chart
    responseTimeChart.update();
    console.log(`Chart updated for site ${siteId}`);
  }
}

function updateChartWithNewData(sites) {
  if (!responseTimeChart || !window.chartData) {
    console.log("Chart not initialized, skipping bulk update");
    return;
  }

  // Update chart data with new values
  sites.forEach((site) => {
    const siteIndex = window.chartData.findIndex((s) => s.id === site.id);
    if (siteIndex !== -1) {
      // Update chartData
      window.chartData[siteIndex].response_time = site.response_time;
      window.chartData[siteIndex].status = site.status;

      // Update chart values
      responseTimeChart.data.datasets[0].data[siteIndex] = site.response_time;
      responseTimeChart.data.datasets[0].backgroundColor[siteIndex] =
        getResponseTimeColor(site.response_time);
      responseTimeChart.data.datasets[0].borderColor[siteIndex] =
        site.status.startsWith("OK") ? "transparent" : "#991B1B";
      responseTimeChart.data.datasets[0].borderWidth[siteIndex] =
        site.status.startsWith("OK") ? 0 : 2;
    }
  });

  // Update the chart
  responseTimeChart.update();
  console.log("Chart updated with bulk data");
}
