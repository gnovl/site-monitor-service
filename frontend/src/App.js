// src/App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import "./App.css";

function App() {
  const [sites, setSites] = useState([]);
  const [newSite, setNewSite] = useState({
    url: "",
    name: "",
    check_interval: 60,
    responseTimeThreshold: 1000, // Default threshold in milliseconds
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for form submission
  const [error, setError] = useState(null);
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [showAddSiteForm, setShowAddSiteForm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showSiteDetails, setShowSiteDetails] = useState(false);

  // Fetch all sites
  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/sites");
      setSites(response.data);

      // Prepare data for the response time chart - improved version
      const chartData = response.data.map((site) => ({
        id: site.id,
        name: site.name || site.url,
        url: site.url,
        responseTime: site.response_time,
        status: site.status,
        lastChecked: site.last_checked,
      }));
      setResponseTimeData(chartData);

      setLoading(false);
      return response.data;
    } catch (err) {
      setError("Failed to fetch sites");
      setLoading(false);
      console.error(err);
      return [];
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSites();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchSites().then((newSites) => {
        // Check for status changes if notifications are enabled
        if (notificationsEnabled && sites.length > 0 && newSites.length > 0) {
          // Compare status changes
          newSites.forEach((newSite) => {
            const oldSite = sites.find((site) => site.id === newSite.id);
            if (oldSite && oldSite.status !== newSite.status) {
              // Status has changed, show notification
              new Notification(`${newSite.name || newSite.url} Status Change`, {
                body: `Status changed from ${oldSite.status} to ${newSite.status}`,
                icon: "/favicon.ico",
              });
            }
          });
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [notificationsEnabled, sites]);

  // Add a new site
  const handleAddSite = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true); // Set submitting state to true when starting
      // The backend currently only supports url, name, and check_interval
      // We'll keep responseTimeThreshold in the frontend state for now
      const siteData = {
        url: newSite.url,
        name: newSite.name,
        check_interval: newSite.check_interval,
      };

      await axios.post("/api/sites", siteData);
      setNewSite({
        url: "",
        name: "",
        check_interval: 60,
        responseTimeThreshold: 1000,
      });
      setShowAddSiteForm(false);
      await fetchSites();
    } catch (err) {
      setError("Failed to add site");
      console.error(err);
    } finally {
      setIsSubmitting(false); // Reset submitting state regardless of outcome
    }
  };

  // Delete a site
  const handleDeleteSite = async (id) => {
    try {
      await axios.delete(`/api/sites/${id}`);
      fetchSites();
    } catch (err) {
      setError("Failed to delete site");
      console.error(err);
    }
  };

  // Manually check a site
  const handleCheckSite = async (id) => {
    try {
      await axios.post(`/api/sites/${id}/check`);
      fetchSites();
    } catch (err) {
      setError("Failed to check site");
      console.error(err);
    }
  };

  // Format last checked time in a user-friendly way
  const formatLastChecked = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the date is today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Check if the date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If it's within the last 7 days, show the day name
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return `${date.toLocaleDateString([], {
        weekday: "long",
      })} at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise, show the date in a readable format
    return (
      date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      ` at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    );
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setError("This browser does not support desktop notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        // Show a test notification
        new Notification("Site Monitor Pro", {
          body: "You will now receive notifications when site status changes.",
          icon: "/favicon.ico",
        });
      } else {
        setNotificationsEnabled(false);
        setError("Notification permission denied");
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      setError("Failed to enable notifications");
    }
  };

  // Show site details
  const viewSiteDetails = (site) => {
    setSelectedSite(site);
    setShowSiteDetails(true);
  };

  // Generate embeddable status badge for a site
  const generateStatusBadge = (site) => {
    const statusColor = site.status.startsWith("OK") ? "green" : "red";
    const badgeUrl = `https://img.shields.io/badge/status-${site.status
      .replace(/[()]/g, "")
      .replace(/ /g, "%20")}-${statusColor}`;
    return badgeUrl;
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Site Monitor Pro
              </h1>
              <p className="ml-4 text-gray-500">
                Monitor your websites in real-time
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={requestNotificationPermission}
                disabled={notificationsEnabled}
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                  notificationsEnabled
                    ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                title={
                  notificationsEnabled
                    ? "Notifications enabled"
                    : "Enable notifications for site status changes"
                }
              >
                {notificationsEnabled
                  ? "Notifications On"
                  : "Enable Notifications"}
              </button>
              <button
                onClick={() => setShowAddSiteForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {sites.length === 0 ? "Add Your First Site" : "Add New Site"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
              {error}
              <button
                onClick={() => setError(null)}
                className="float-right font-bold"
              >
                &times;
              </button>
            </div>
          )}

          {/* Dashboard Cards - Only show if there are sites */}
          {sites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <h2 className="text-lg font-medium mb-2">Total Sites</h2>
                <p className="text-3xl font-bold">{sites.length}</p>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <h2 className="text-lg font-medium mb-2">Sites Up</h2>
                <p className="text-3xl font-bold text-green-600">
                  {sites.filter((site) => site.status.startsWith("OK")).length}
                </p>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <h2 className="text-lg font-medium mb-2">Sites Down</h2>
                <p className="text-3xl font-bold text-red-600">
                  {sites.filter((site) => !site.status.startsWith("OK")).length}
                </p>
              </div>
            </div>
          )}

          {/* Response Time Chart - Only show if there are sites */}
          {sites.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-lg font-medium mb-4">Response Time Chart</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={responseTimeData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      label={{
                        value: "Response Time (ms)",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const site = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
                              <p className="font-semibold text-gray-900">
                                {site.name}
                              </p>
                              <div className="mt-1 text-sm">
                                <p className="flex justify-between">
                                  <span className="text-gray-600 mr-3">
                                    Response Time:
                                  </span>
                                  <span
                                    className={
                                      site.responseTime > 1000
                                        ? "text-red-600 font-medium"
                                        : site.responseTime > 500
                                        ? "text-yellow-600"
                                        : "text-gray-900"
                                    }
                                  >
                                    {site.responseTime} ms
                                  </span>
                                </p>
                                <p className="flex justify-between mt-1">
                                  <span className="text-gray-600 mr-3">
                                    Status:
                                  </span>
                                  <span
                                    className={
                                      site.status?.startsWith("OK")
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {site.status}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  Click on bar to view details
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="responseTime"
                      name="Response Time"
                      onClick={(data) =>
                        viewSiteDetails(
                          sites.find((site) => site.id === data.id)
                        )
                      }
                      cursor="pointer"
                    >
                      {responseTimeData.map((entry, index) => {
                        // Determine color based on response time thresholds
                        const barColor =
                          entry.responseTime > 1000
                            ? "#EF4444" // red for slow responses
                            : entry.responseTime > 500
                            ? "#F59E0B" // amber for medium responses
                            : "#10B981"; // green for fast responses

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={barColor}
                            strokeWidth={entry.status?.startsWith("OK") ? 0 : 2}
                            stroke={
                              entry.status?.startsWith("OK") ? "" : "#991B1B"
                            }
                          />
                        );
                      })}
                    </Bar>
                    <ReferenceLine
                      x={1000}
                      stroke="#EF4444"
                      strokeDasharray="3 3"
                    >
                      <Label
                        value="Slow (1000ms)"
                        position="top"
                        fill="#EF4444"
                      />
                    </ReferenceLine>
                    <ReferenceLine
                      x={500}
                      stroke="#F59E0B"
                      strokeDasharray="3 3"
                    >
                      <Label
                        value="Medium (500ms)"
                        position="top"
                        fill="#F59E0B"
                      />
                    </ReferenceLine>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-4">
                  <span className="inline-block px-2 py-1 bg-green-100 rounded mr-2">
                    Fast response
                  </span>
                  <span className="inline-block px-2 py-1 bg-yellow-100 rounded mr-2">
                    Medium response (&gt;500ms)
                  </span>
                  <span className="inline-block px-2 py-1 bg-red-100 rounded">
                    Slow response (&gt;1000ms)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Add Site Form - Now part of the conditional below */}
          {showAddSiteForm && (
            <div className="bg-white shadow-md rounded-lg mb-6 p-6 border border-gray-200">
              <h2 className="text-lg font-medium mb-4">
                {sites.length === 0
                  ? "Add Your First Site"
                  : "Add a New Site to Monitor"}
              </h2>
              <form onSubmit={handleAddSite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL
                    </label>
                    <input
                      type="url"
                      required
                      value={newSite.url}
                      onChange={(e) =>
                        setNewSite({ ...newSite, url: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={newSite.name}
                      onChange={(e) =>
                        setNewSite({ ...newSite, name: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="My Website"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Check Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={newSite.check_interval}
                      onChange={(e) =>
                        setNewSite({
                          ...newSite,
                          check_interval: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Response Time Threshold (ms)
                    </label>
                    <input
                      type="number"
                      min="100"
                      value={newSite.responseTimeThreshold}
                      onChange={(e) =>
                        setNewSite({
                          ...newSite,
                          responseTimeThreshold: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-gray-500 focus:border-gray-500"
                      title="Warning will be shown if response time exceeds this value"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddSiteForm(false)}
                    className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner />
                        {sites.length === 0
                          ? "Adding First Site..."
                          : "Adding..."}
                      </>
                    ) : sites.length === 0 ? (
                      "Add First Site"
                    ) : (
                      "Add Site"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Monitored Sites or Welcome Section - Only show if there are sites or if the form is not shown */}
          {(sites.length > 0 || !showAddSiteForm) && (
            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-medium mb-4">
                {sites.length === 0
                  ? "Welcome to Site Monitor Pro"
                  : "Monitored Sites"}
              </h2>

              {sites.length === 0 && !showAddSiteForm ? (
                <div className="py-10 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Get started with your website monitoring
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Track uptime, response times, and get alerts when your sites
                    go down.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddSiteForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="-ml-1 mr-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Your First Site
                    </button>
                  </div>
                </div>
              ) : sites.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Response Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Checked
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sites.map((site) => (
                        <tr key={site.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {site.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {site.url}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                site.status.startsWith("OK")
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {site.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={
                                site.response_time > 1000
                                  ? "text-red-600 font-medium"
                                  : site.response_time > 500
                                  ? "text-yellow-600"
                                  : "text-gray-500"
                              }
                            >
                              {site.response_time} ms
                              {site.response_time > 1000 && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Slow
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {site.last_checked
                              ? formatLastChecked(site.last_checked)
                              : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleCheckSite(site.id)}
                              className="text-gray-900 hover:text-gray-700 mr-3"
                            >
                              Check Now
                            </button>
                            <button
                              onClick={() => viewSiteDetails(site)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleDeleteSite(site.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Site Details Modal */}
        {showSiteDetails && selectedSite && (
          <div
            className="fixed inset-0 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900"
                        id="modal-title"
                      >
                        {selectedSite.name} Details
                      </h3>

                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            URL
                          </h4>
                          <p className="mt-1">{selectedSite.url}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Current Status
                          </h4>
                          <p className="mt-1">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                selectedSite.status.startsWith("OK")
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {selectedSite.status}
                            </span>
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Last Checked
                          </h4>
                          <p className="mt-1">
                            {selectedSite.last_checked
                              ? formatLastChecked(selectedSite.last_checked)
                              : "Never"}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Response Time
                          </h4>
                          <p className="mt-1">
                            {selectedSite.response_time} ms
                            {selectedSite.response_time > 1000 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Slow
                              </span>
                            )}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Check Interval
                          </h4>
                          <p className="mt-1">
                            {selectedSite.check_interval} seconds
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Status Badge
                          </h4>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="mb-2 text-xs">
                              You can embed this badge in your README or
                              website:
                            </p>
                            <img
                              src={generateStatusBadge(selectedSite)}
                              alt="Status Badge"
                              className="mb-2"
                            />
                            <input
                              type="text"
                              readOnly
                              value={`![Status](${generateStatusBadge(
                                selectedSite
                              )})`}
                              className="text-xs mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                              onClick={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowSiteDetails(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => handleCheckSite(selectedSite.id)}
                  >
                    Check Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Site Monitor Pro - DevOps Showcase
            Project
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
