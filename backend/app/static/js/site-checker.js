// Site Checker - Handles site checking functionality

// Make functions globally available
window.checkSite = checkSite;
window.updateSiteInfo = updateSiteInfo;
window.showSpinner = showSpinner;
window.hideSpinner = hideSpinner;
window.showToast = showToast;
window.hideToast = hideToast;
window.copyToClipboard = copyToClipboard;

function showSpinner(button) {
  // Store the original text
  button.setAttribute("data-original-text", button.innerText);
  // Replace with spinner
  button.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800 inline-block" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Checking...
  `;
  button.disabled = true;
}

function hideSpinner(button) {
  // Restore the original text
  button.innerText = button.getAttribute("data-original-text");
  button.disabled = false;
}

function showToast(title, message, type = "success") {
  const toast = document.getElementById("successToast");
  if (!toast) return;

  document.getElementById("toastTitle").innerText = title;
  document.getElementById("toastMessage").innerText = message;

  // Update colors based on type
  if (type === "error") {
    toast.className = toast.className.replace(
      "bg-green-100 border-green-500 text-green-700",
      "bg-red-100 border-red-500 text-red-700"
    );
  } else {
    toast.className = toast.className.replace(
      "bg-red-100 border-red-500 text-red-700",
      "bg-green-100 border-green-500 text-green-700"
    );
  }

  // Show the toast
  toast.classList.remove("translate-y-full", "opacity-0");

  // Hide after 3 seconds
  setTimeout(() => {
    hideToast();
  }, 3000);
}

function hideToast() {
  const toast = document.getElementById("successToast");
  if (toast) {
    toast.classList.add("translate-y-full", "opacity-0");
  }
}

function updateSiteInfo(siteId, data) {
  // Only update the specific row for this site ID
  const row = document.querySelector(`tr[data-site-id="${siteId}"]`);
  if (!row) return;

  // Update status
  const statusCell = row.querySelector(".site-status-cell");
  if (statusCell) {
    const statusClass = data.status.startsWith("OK")
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

    statusCell.innerHTML = `
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
        ${data.status}
      </span>
    `;
  }

  // Update response time
  const responseTimeCell = row.querySelector(".site-response-time-cell");
  if (responseTimeCell) {
    let responseTimeClass = "text-gray-500";
    let slowLabel = "";

    if (data.response_time > 1000) {
      responseTimeClass = "text-red-600 font-medium";
      slowLabel = `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Slow</span>`;
    } else if (data.response_time > 500) {
      responseTimeClass = "text-yellow-600";
    }

    responseTimeCell.innerHTML = `
      <div class="flex items-center">
        <span class="${responseTimeClass}">
          ${data.response_time} ms
        </span>
        ${slowLabel}
      </div>
    `;
  }

  // Update last checked
  const lastCheckedCell = row.querySelector(".site-last-checked-cell");
  if (lastCheckedCell) {
    lastCheckedCell.innerText = "Just now";
  }

  // Update the chart only for this specific site
  if (typeof updateChart === "function") {
    updateChart(siteId, data);
  }

  // If details modal is open for this site, update it too
  if (
    window.currentSiteId === siteId &&
    typeof updateDetailsModal === "function"
  ) {
    updateDetailsModal(data);
  }

  // Update status indicator dot
  const statusDot = row.querySelector(".h-2.w-2");
  if (statusDot) {
    statusDot.className = statusDot.className.replace(
      data.status.startsWith("OK") ? "bg-red-400" : "bg-green-400",
      data.status.startsWith("OK") ? "bg-green-400" : "bg-red-400"
    );
  }
}

function checkSite(siteId) {
  // Prevent default event behavior if needed
  if (event) event.preventDefault();

  // Find the button that was clicked
  const button = event.currentTarget;

  // Show spinner
  showSpinner(button);

  // Make AJAX request to check the site
  fetch(`/api/sites/${siteId}/check`, {
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
      // Update site info in the table ONLY for this specific site
      updateSiteInfo(siteId, data);

      // Show success notification
      showToast("Site Checked", `${data.name} has been checked successfully.`);

      // Hide spinner
      hideSpinner(button);
    })
    .catch((error) => {
      console.error("Error checking site:", error);

      // Show error notification
      showToast("Error", "Failed to check site. Please try again.", "error");

      // Hide spinner
      hideSpinner(button);
    });
}

// Helper function for copying to clipboard with visual feedback
function copyToClipboard(button, text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      // Change icon to checkmark temporarily
      const originalIcon = button.innerHTML;
      button.innerHTML = `
      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
    `;
      button.classList.add("copy-success");

      // Show success toast
      showToast("Copied!", "Badge code copied to clipboard");

      // Restore original icon after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalIcon;
        button.classList.remove("copy-success");
      }, 2000);
    })
    .catch(function (err) {
      console.error("Failed to copy text: ", err);
      showToast("Error", "Failed to copy to clipboard", "error");
    });
}
