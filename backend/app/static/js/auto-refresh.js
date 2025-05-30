// Auto Refresh - Handles automatic site status updates

function setupAutoRefresh() {
  // Only setup auto-refresh if there are sites to monitor
  if (document.querySelectorAll("tr[data-site-id]").length === 0) {
    console.log("No sites to monitor, skipping auto-refresh setup");
    return;
  }

  console.log("Setting up auto-refresh for site status");

  // Refresh site data every 30 seconds
  setInterval(refreshAllSites, 30000);
}

function refreshAllSites() {
  // Get all site IDs from the table
  const siteRows = document.querySelectorAll("tr[data-site-id]");

  // No sites to refresh
  if (siteRows.length === 0) {
    console.log("No sites found for refresh");
    return;
  }

  console.log("Auto-refreshing site statuses");

  // Fetch latest data for all sites
  fetch("/api/sites", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((sites) => {
      console.log(`Refreshed data for ${sites.length} sites`);

      // Process each site and update the UI
      sites.forEach((site) => {
        updateSiteRow(site);
      });

      // Update chart if it exists
      if (typeof updateChartWithNewData === "function" && window.chartData) {
        updateChartWithNewData(sites);
      }

      // Update dashboard stats
      updateDashboardStats(sites);
    })
    .catch((error) => {
      console.error("Error refreshing sites:", error);
    });
}

function updateSiteRow(site) {
  // Find the row for this site
  const row = document.querySelector(`tr[data-site-id="${site.id}"]`);
  if (!row) {
    console.log(`Row not found for site ${site.id}`);
    return;
  }

  // Update status
  const statusCell = row.querySelector(".site-status-cell");
  if (statusCell) {
    const statusClass = site.status.startsWith("OK")
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

    statusCell.innerHTML = `
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
        ${site.status}
      </span>
    `;
  }

  // Update response time
  const responseTimeCell = row.querySelector(".site-response-time-cell");
  if (responseTimeCell) {
    let responseTimeClass = "text-gray-500";
    let slowLabel = "";

    if (site.response_time > 1000) {
      responseTimeClass = "text-red-600 font-medium";
      slowLabel = `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Slow</span>`;
    } else if (site.response_time > 500) {
      responseTimeClass = "text-yellow-600";
    }

    responseTimeCell.innerHTML = `
      <div class="flex items-center">
        <span class="${responseTimeClass}">
          ${site.response_time} ms
        </span>
        ${slowLabel}
      </div>
    `;
  }

  // Update last checked time
  const lastCheckedCell = row.querySelector(".site-last-checked-cell");
  if (lastCheckedCell && site.last_checked_formatted) {
    lastCheckedCell.textContent = site.last_checked_formatted;
  }

  // Update status indicator dot
  const statusDot = row.querySelector(".h-2.w-2");
  if (statusDot) {
    const newClass = site.status.startsWith("OK")
      ? "bg-green-400"
      : "bg-red-400";
    const oldClass = site.status.startsWith("OK")
      ? "bg-red-400"
      : "bg-green-400";
    statusDot.className = statusDot.className.replace(oldClass, newClass);
  }

  // If details modal is open for this site, update that too
  if (
    window.currentSiteId === site.id &&
    typeof updateDetailsModal === "function"
  ) {
    updateDetailsModal(site);
  }
}

function updateDashboardStats(sites) {
  const totalSites = sites.length;
  const sitesUp = sites.filter((site) => site.status.startsWith("OK")).length;
  const sitesDown = totalSites - sitesUp;

  // Update total sites
  const totalElement = document.querySelector(
    '[class*="text-3xl"][class*="font-bold"][class*="text-gray-900"]'
  );
  if (
    totalElement &&
    totalElement.textContent.trim() !== totalSites.toString()
  ) {
    totalElement.textContent = totalSites;
  }

  // Update sites up
  const upElements = document.querySelectorAll(
    '[class*="text-3xl"][class*="font-bold"][class*="text-green-600"]'
  );
  upElements.forEach((el) => {
    if (el.textContent.trim() !== sitesUp.toString()) {
      el.textContent = sitesUp;
    }
  });

  // Update sites down
  const downElements = document.querySelectorAll(
    '[class*="text-3xl"][class*="font-bold"][class*="text-red-600"]'
  );
  downElements.forEach((el) => {
    if (el.textContent.trim() !== sitesDown.toString()) {
      el.textContent = sitesDown;
    }
  });

  console.log(
    `Dashboard stats updated: ${totalSites} total, ${sitesUp} up, ${sitesDown} down`
  );
}
