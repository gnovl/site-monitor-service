// Modal Manager - Handles site details modal functionality

// Global variable to track current site
window.currentSiteId = null;

// Make functions globally available
window.showSiteDetails = showSiteDetails;
window.updateDetailsModal = updateDetailsModal;
window.closeSiteDetailsModal = closeSiteDetailsModal;

// Initialize modal functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeModal();
});

function initializeModal() {
  const detailsModal = document.getElementById("siteDetailsModal");
  const closeSiteDetailsBtn = document.getElementById("closeSiteDetailsBtn");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");
  const checkSiteFromDetailsBtn = document.getElementById(
    "checkSiteFromDetailsBtn"
  );

  if (!detailsModal) {
    console.error("Site details modal not found");
    return;
  }

  // Close modal event listeners
  if (closeSiteDetailsBtn) {
    closeSiteDetailsBtn.addEventListener("click", closeSiteDetailsModal);
  }

  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener("click", closeSiteDetailsModal);
  }

  // Close modal if clicked outside - Fixed to target the modal background properly
  detailsModal.addEventListener("click", function (event) {
    // Close if clicking on the modal backdrop (not the modal content)
    if (event.target === detailsModal) {
      closeSiteDetailsModal();
    }
  });

  // Check site from details modal
  if (checkSiteFromDetailsBtn) {
    checkSiteFromDetailsBtn.addEventListener("click", function () {
      if (window.currentSiteId) {
        if (typeof showSpinner === "function") {
          showSpinner(checkSiteFromDetailsBtn);
        }

        fetch(`/api/sites/${window.currentSiteId}/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json();
          })
          .then((data) => {
            // Update site info in the table for only this specific site
            if (typeof updateSiteInfo === "function") {
              updateSiteInfo(window.currentSiteId, data);
            }

            // Update the modal with the new data which includes history
            updateDetailsModal(data);

            // Show success notification
            if (typeof showToast === "function") {
              showToast(
                "Site Checked",
                `${data.name} has been checked successfully.`
              );
            }

            // Hide spinner
            if (typeof hideSpinner === "function") {
              hideSpinner(checkSiteFromDetailsBtn);
            }
          })
          .catch((error) => {
            console.error("Error checking site:", error);

            // Show error notification
            if (typeof showToast === "function") {
              showToast(
                "Error",
                "Failed to check site. Please try again.",
                "error"
              );
            }

            // Hide spinner
            if (typeof hideSpinner === "function") {
              hideSpinner(checkSiteFromDetailsBtn);
            }
          });
      }
    });
  }

  console.log("Modal manager initialized successfully");
}

function closeSiteDetailsModal() {
  const detailsModal = document.getElementById("siteDetailsModal");
  const siteDetailsContent = document.getElementById("siteDetailsContent");

  if (detailsModal) {
    detailsModal.style.display = "none";
  }

  if (siteDetailsContent) {
    siteDetailsContent.innerHTML = `
      <div class="flex items-center justify-center h-32">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-500">Loading site details...</span>
        </div>
      </div>
    `;
  }

  window.currentSiteId = null;
}

function showSiteDetails(siteId, siteName) {
  const detailsModal = document.getElementById("siteDetailsModal");
  const siteNameElement = document.getElementById("siteName");

  if (!detailsModal) {
    console.error("Modal not found");
    return;
  }

  // Store the current site ID
  window.currentSiteId = siteId;

  // Set the site name in the modal
  if (siteNameElement) {
    siteNameElement.textContent = siteName || `Site ${siteId}`;
  }

  // Show the modal
  detailsModal.style.display = "block";

  // Fetch the site details
  fetch(`/api/sites/${siteId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Site details fetched:", data);
      // Update the modal with site details
      updateDetailsModal(data);
    })
    .catch((error) => {
      console.error("Error fetching site details:", error);
      const siteDetailsContent = document.getElementById("siteDetailsContent");
      if (siteDetailsContent) {
        siteDetailsContent.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <div class="flex items-center">
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>Error loading site details: ${error.message}</p>
          </div>
        </div>
      `;
      }
    });
}

function updateDetailsModal(data) {
  const siteDetailsContent = document.getElementById("siteDetailsContent");
  if (!siteDetailsContent) {
    console.error("Site details content container not found");
    return;
  }

  console.log("Updating modal with data:", data);

  // Ensure we have the required data
  if (!data) {
    console.error("No data provided to updateDetailsModal");
    return;
  }

  // Set defaults for missing data
  const siteData = {
    id: data.id || "N/A",
    name: data.name || "Unknown Site",
    url: data.url || "N/A",
    status: data.status || "Unknown",
    response_time: data.response_time || 0,
    check_interval: data.check_interval || 60,
    last_checked_formatted: data.last_checked_formatted || "Never",
    uptime_percentage: data.uptime_percentage || 100,
    history: data.history || [],
  };

  // Format the status and response time classes
  const statusClass = siteData.status.startsWith("OK")
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  let responseTimeClass = "text-gray-500";
  let responseTimeIcon = "";

  if (siteData.response_time > 1000) {
    responseTimeClass = "text-red-600 font-semibold";
    responseTimeIcon = `<svg style="width: 10px; height: 10px; margin-left: 3px; display: inline-block; vertical-align: middle;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
  } else if (siteData.response_time > 500) {
    responseTimeClass = "text-yellow-600 font-medium";
    responseTimeIcon = `<svg style="width: 10px; height: 10px; margin-left: 3px; display: inline-block; vertical-align: middle;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
  } else {
    responseTimeIcon = `<svg style="width: 10px; height: 10px; margin-left: 3px; display: inline-block; vertical-align: middle;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
  }

  // Generate the badge URL
  const statusText = siteData.status.replace(/[()]/g, "").replace(/ /g, "%20");
  const statusColor = siteData.status.startsWith("OK") ? "green" : "red";
  const badgeUrl = `https://img.shields.io/badge/status-${statusText}-${statusColor}`;

  // Use history exactly as returned from API
  const historyToShow = Array.isArray(siteData.history)
    ? siteData.history.slice(0, 4)
    : [];
  const hasHistory = historyToShow.length > 0;
  const totalHistoryCount = Array.isArray(siteData.history)
    ? siteData.history.length
    : 0;

  // Get uptime color class
  const uptimeClass =
    siteData.uptime_percentage >= 95
      ? "text-green-600"
      : siteData.uptime_percentage >= 80
      ? "text-yellow-600"
      : "text-red-600";

  // Create the modal content with compact spacing and NO internal scrolling
  const modalContent = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- URL Section -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 10px;">
        <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 6px;">Website URL</div>
        <div style="font-size: 11px; color: #111827; word-break: break-all; font-family: monospace; background-color: white; padding: 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${
          siteData.url
        }</div>
      </div>

      <!-- Status Grid - 2x2 layout with tighter spacing -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
          <div style="font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">Status</div>
          <span style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;" class="${statusClass}">
            ${siteData.status}
          </span>
        </div>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
          <div style="font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">Response Time</div>
          <div style="display: flex; align-items: center; font-size: 11px; font-family: monospace;" class="${responseTimeClass}">
            <span>${siteData.response_time}ms</span>${responseTimeIcon}
          </div>
        </div>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
          <div style="font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">Uptime</div>
          <div style="font-size: 14px; font-weight: 700;" class="${uptimeClass}">
            ${siteData.uptime_percentage}%
          </div>
        </div>

        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px;">
          <div style="font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">Check Interval</div>
          <div style="font-size: 11px; color: #111827;">${
            siteData.check_interval
          }s</div>
        </div>
      </div>

      <!-- Recent History Section - Compact, no internal scrolling -->
      <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
        <div style="padding: 8px 10px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 11px; font-weight: 500; color: #111827; margin: 0;">Last 4 Checks</h3>
            <span style="font-size: 10px; color: #6b7280;">${
              historyToShow.length
            }/${totalHistoryCount}</span>
          </div>
        </div>
        <div>
          ${
            hasHistory
              ? `
            <div>
              ${historyToShow
                .map((entry) => {
                  const entryDate = new Date(entry.timestamp);
                  const timeAgo = getTimeAgo(entryDate);
                  const isSuccess = entry.status.startsWith("OK");

                  return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 10px;">
                    <div style="display: flex; align-items: center;">
                      <div style="width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; background-color: ${
                        isSuccess ? "#10b981" : "#ef4444"
                      };"></div>
                      <span style="color: ${
                        isSuccess ? "#059669" : "#dc2626"
                      };">${entry.status}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-family: monospace; color: ${
                        entry.response_time > 1000
                          ? "#dc2626"
                          : entry.response_time > 500
                          ? "#d97706"
                          : "#6b7280"
                      };">
                        ${entry.response_time}ms
                      </span>
                      <span style="color: #6b7280;">${timeAgo}</span>
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
          `
              : `
            <div style="padding: 16px; text-align: center; font-size: 11px; color: #6b7280;">
              <div style="color: #ef4444; font-weight: 500; margin-bottom: 2px;">No history available</div>
              <div style="color: #9ca3af;">Check the site to start collecting history</div>
            </div>
          `
          }
        </div>
      </div>

      <!-- Status Badge Section -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 500; color: #374151;">Status Badge</span>
          <img src="${badgeUrl}" alt="Status Badge" style="height: 16px;" />
        </div>
        <div style="position: relative;">
          <input type="text" readonly value="![Status](${badgeUrl})" 
                 style="width: 100%; font-size: 10px; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 24px 4px 8px; background-color: white; font-family: monospace;" 
                 onclick="this.select()" />
          <button onclick="copyToClipboard(this, this.previousElementSibling.value)" 
                  style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); padding: 2px; color: #9ca3af; background: none; border: none; cursor: pointer;">
            <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Set the content
  siteDetailsContent.innerHTML = modalContent;
  console.log("Modal content updated successfully");
}

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
