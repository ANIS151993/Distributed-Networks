const DATA_URL = "assets/data/research-data.json";

const COLORS = {
  slate: "#18323d",
  teal: "#0f766e",
  tealSoft: "#7fd4c7",
  amber: "#d97706",
  coral: "#d95d39",
  sand: "#f3b562",
  ink: "#182730",
  soft: "#52626b",
  grid: "rgba(24, 50, 61, 0.12)"
};

let cachedData = null;

window.toggleNav = function toggleNav() {
  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    navLinks.classList.toggle("open");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  setupChrome();
  setupReveal();

  try {
    cachedData = await loadData();
    populatePage(cachedData);
    renderPlots(cachedData);
  } catch (error) {
    renderLoadError(error);
  }
});

async function loadData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Unable to load ${DATA_URL}`);
  }
  return response.json();
}

function setupChrome() {
  const navLinks = document.getElementById("navLinks");
  const scrollProgress = document.getElementById("scrollProgress");

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      if (navLinks) {
        navLinks.classList.remove("open");
      }
    });
  });

  if (scrollProgress) {
    const updateScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      scrollProgress.style.width = `${progress}%`;
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
  }
}

function setupReveal() {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  if (!revealNodes.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function populatePage(data) {
  populateTextualContent(data);
  populateTaskTable(data);
  populateTaskExplorer(data);
}

function populateTextualContent(data) {
  setText("abstractText", data.abstract);
  setText("platformSpec", data.experimentalSetup.platform);
  setText("citationBlock", data.citation.bibtex);

  const contributionsList = document.getElementById("contributionsList");
  if (contributionsList) {
    contributionsList.innerHTML = data.contributions
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
  }

  const algorithmSteps = document.getElementById("algorithmSteps");
  if (algorithmSteps) {
    algorithmSteps.innerHTML = data.methodology.algorithmSteps
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join("");
  }

  const integrityNotes = document.getElementById("integrityNotes");
  if (integrityNotes) {
    integrityNotes.innerHTML = data.dataIntegrityNotes
      .map((note) => `<li>${escapeHtml(note)}</li>`)
      .join("");
  }

  const heroFactList = document.getElementById("heroFactList");
  if (heroFactList) {
    heroFactList.innerHTML = data.motivation
      .map((fact) => `<li>${escapeHtml(fact)}</li>`)
      .join("");
  }
}

function populateTaskTable(data) {
  const table = document.getElementById("taskDemandTable");
  if (!table) {
    return;
  }

  const tbody = table.querySelector("tbody");
  if (!tbody) {
    return;
  }

  tbody.innerHTML = data.tasks
    .map(
      (task) => `
        <tr>
          <td>${escapeHtml(task.id)}</td>
          <td>${task.demandUnits} units</td>
          <td>${escapeHtml(task.sizeClass)}</td>
        </tr>
      `
    )
    .join("");
}

function populateTaskExplorer(data) {
  const selector = document.getElementById("taskSelector");
  if (!selector) {
    return;
  }

  selector.innerHTML = data.tasks
    .map((task) => `<option value="${task.id}">${task.id} • ${task.demandUnits} units • ${task.sizeClass}</option>`)
    .join("");

  selector.addEventListener("change", () => {
    renderTaskExplorer(data, selector.value);
  });

  renderTaskExplorer(data, data.tasks[0].id);
}

function renderTaskExplorer(data, taskId) {
  const explorer = document.getElementById("taskExplorer");
  if (!explorer) {
    return;
  }

  const task = data.tasks.find((item) => item.id === taskId);
  const staticPlacement = findTaskPlacement(data.allocationMapping.static, taskId);
  const auctionPlacement = findTaskPlacement(data.allocationMapping.auction, taskId);
  const staticCapacity = lookupNodeCapacity(data, staticPlacement);
  const auctionCapacity = lookupNodeCapacity(data, auctionPlacement);

  explorer.innerHTML = `
    <div class="task-explorer-grid">
      <article class="task-fact">
        <span>Task profile</span>
        <strong>${escapeHtml(task.id)}</strong>
        <div>${task.demandUnits} units • ${escapeHtml(task.sizeClass)}</div>
      </article>
      <article class="task-fact">
        <span>Static placement</span>
        <strong>${escapeHtml(formatPlacement(staticPlacement))}</strong>
        <div>${formatCapacity(staticCapacity)}</div>
      </article>
      <article class="task-fact">
        <span>Auction placement</span>
        <strong>${escapeHtml(formatPlacement(auctionPlacement))}</strong>
        <div>${formatCapacity(auctionCapacity)}</div>
      </article>
      <article class="task-fact">
        <span>Interpretation</span>
        <strong>${escapeHtml(buildTaskInterpretation(task, staticPlacement, auctionPlacement))}</strong>
      </article>
    </div>
  `;
}

function renderPlots(data) {
  if (typeof Plotly === "undefined") {
    return;
  }

  renderDistPlot(data);
  renderPiePlot(data);
  renderViolinPlot(data);
  bindHeatMap(data);
  renderHeatMap(data, "static");
  renderPairPlot(data);
  renderJointPlot(data);
  renderPerformanceBarPlot(data);
  renderEfficiencyTrend(data);
}

function renderDistPlot(data) {
  const target = document.getElementById("distPlot");
  if (!target) {
    return;
  }

  const demands = data.tasks.map((task) => task.demandUnits);
  const xGrid = buildRange(1, 16, 0.25);
  const bandwidth = 1.2;
  const density = xGrid.map((x) => gaussianKde(demands, x, bandwidth));

  const traces = [
    {
      type: "histogram",
      x: demands,
      nbinsx: 7,
      marker: {
        color: COLORS.teal,
        line: {
          color: COLORS.ink,
          width: 1
        }
      },
      opacity: 0.78,
      name: "Demand counts"
    },
    {
      type: "scatter",
      mode: "lines",
      x: xGrid,
      y: density.map((value) => value * demands.length * 1.6),
      name: "Smoothed density",
      line: {
        color: COLORS.amber,
        width: 3,
        shape: "spline"
      }
    }
  ];

  const layout = baseLayout({
    margin: { l: 48, r: 20, t: 10, b: 48 },
    xaxis: {
      title: "Task demand (units)",
      dtick: 2,
      gridcolor: COLORS.grid,
      zeroline: false
    },
    yaxis: {
      title: "Frequency / density",
      gridcolor: COLORS.grid,
      zeroline: false
    },
    showlegend: false
  });

  Plotly.newPlot(target, traces, layout, plotConfig());
}

function renderPiePlot(data) {
  const target = document.getElementById("piePlot");
  if (!target) {
    return;
  }

  const demandByClass = aggregateDemandByClass(data.tasks);

  const trace = {
    type: "pie",
    labels: Object.keys(demandByClass),
    values: Object.values(demandByClass),
    hole: 0.48,
    textinfo: "label+percent",
    marker: {
      colors: [COLORS.teal, COLORS.amber, COLORS.coral]
    },
    sort: false
  };

  const layout = baseLayout({
    margin: { l: 10, r: 10, t: 10, b: 10 },
    showlegend: false
  });

  Plotly.newPlot(target, [trace], layout, plotConfig());
}

function renderViolinPlot(data) {
  const target = document.getElementById("violinPlot");
  if (!target) {
    return;
  }

  const representative = data.representativeRunFigureDerived;
  const staticValues = Object.values(representative.staticUsageUnits);
  const auctionValues = Object.values(representative.auctionUsageUnits);

  const traces = [
    {
      type: "violin",
      y: staticValues,
      name: "Static",
      box: { visible: true },
      meanline: { visible: true },
      line: { color: COLORS.coral },
      fillcolor: "rgba(217, 93, 57, 0.38)",
      opacity: 0.78
    },
    {
      type: "violin",
      y: auctionValues,
      name: "Auction",
      box: { visible: true },
      meanline: { visible: true },
      line: { color: COLORS.teal },
      fillcolor: "rgba(15, 118, 110, 0.42)",
      opacity: 0.82
    }
  ];

  const layout = baseLayout({
    margin: { l: 48, r: 20, t: 10, b: 40 },
    yaxis: {
      title: "Per-node usage (representative units)",
      gridcolor: COLORS.grid,
      zeroline: false
    },
    xaxis: {
      zeroline: false
    }
  });

  Plotly.newPlot(target, traces, layout, plotConfig());
}

function bindHeatMap(data) {
  const buttons = document.querySelectorAll("[data-heatmap-mode]");
  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderHeatMap(data, button.dataset.heatmapMode);
    });
  });
}

function renderHeatMap(data, mode) {
  const target = document.getElementById("heatMapPlot");
  if (!target) {
    return;
  }

  const nodes = ["A", "B", "C", "D", "E", "Unallocated"];
  const nodeLabels = nodes.map((nodeId) => (nodeId === "Unallocated" ? nodeId : `Node ${nodeId}`));
  const tasks = data.tasks.map((task) => task.id);
  const matrix = nodes.map((nodeId) =>
    tasks.map((taskId) => {
      const assigned = data.allocationMapping[mode][nodeId] || [];
      const task = data.tasks.find((item) => item.id === taskId);
      return assigned.includes(taskId) ? task.demandUnits : 0;
    })
  );

  const annotations = [];
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value > 0) {
        annotations.push({
          x: tasks[colIndex],
          y: nodeLabels[rowIndex],
          text: `${value}`,
          font: { color: "white", size: 12, family: "Manrope, sans-serif" },
          showarrow: false
        });
      }
    });
  });

  const trace = {
    type: "heatmap",
    x: tasks,
    y: nodeLabels,
    z: matrix,
    colorscale: [
      [0, "#f0f4f5"],
      [0.15, "#c2e8df"],
      [0.55, "#429d8d"],
      [1, "#103e45"]
    ],
    hovertemplate: "Task %{x}<br>%{y}<br>Demand %{z} units<extra></extra>",
    xgap: 2,
    ygap: 2
  };

  const layout = baseLayout({
    margin: { l: 92, r: 16, t: 8, b: 64 },
    xaxis: {
      title: "Tasks",
      tickangle: -20,
      side: "bottom"
    },
    yaxis: {
      title: "Node / outcome",
      autorange: "reversed"
    },
    annotations
  });

  Plotly.react(target, [trace], layout, plotConfig());
}

function renderPairPlot(data) {
  const target = document.getElementById("pairPlot");
  if (!target) {
    return;
  }

  const sizeColorMap = {
    Small: COLORS.teal,
    Medium: COLORS.amber,
    Large: COLORS.coral
  };

  const pairRows = data.tasks.map((task) => {
    const staticPlacement = findTaskPlacement(data.allocationMapping.static, task.id);
    const auctionPlacement = findTaskPlacement(data.allocationMapping.auction, task.id);
    const staticCapacity = lookupNodeCapacity(data, staticPlacement) || 0;
    const auctionCapacity = lookupNodeCapacity(data, auctionPlacement) || 0;

    return {
      label: task.id,
      demand: task.demandUnits,
      staticCapacity,
      auctionCapacity,
      capacityShift: auctionCapacity - staticCapacity,
      color: sizeColorMap[task.sizeClass]
    };
  });

  const trace = {
    type: "splom",
    dimensions: [
      { label: "Demand", values: pairRows.map((row) => row.demand) },
      { label: "Static capacity", values: pairRows.map((row) => row.staticCapacity) },
      { label: "Auction capacity", values: pairRows.map((row) => row.auctionCapacity) },
      { label: "Capacity shift", values: pairRows.map((row) => row.capacityShift) }
    ],
    text: pairRows.map((row) => row.label),
    marker: {
      color: pairRows.map((row) => row.color),
      size: 10,
      line: {
        color: "rgba(24, 50, 61, 0.3)",
        width: 0.8
      }
    },
    hovertemplate: "%{text}<extra></extra>"
  };

  const layout = baseLayout({
    margin: { l: 36, r: 16, t: 6, b: 16 },
    dragmode: false
  });

  Plotly.newPlot(target, [trace], layout, plotConfig());
}

function renderJointPlot(data) {
  const target = document.getElementById("jointPlot");
  if (!target) {
    return;
  }

  const classPalette = {
    Small: COLORS.teal,
    Medium: COLORS.amber,
    Large: COLORS.coral
  };

  const scatterPoints = data.tasks.map((task) => {
    const placement = findTaskPlacement(data.allocationMapping.auction, task.id);
    return {
      id: task.id,
      demand: task.demandUnits,
      capacity: lookupNodeCapacity(data, placement) || 0,
      sizeClass: task.sizeClass,
      placement
    };
  });

  const traces = [
    ...["Small", "Medium", "Large"].map((sizeClass) => {
      const rows = scatterPoints.filter((item) => item.sizeClass === sizeClass);
      return {
        type: "scatter",
        mode: "markers+text",
        x: rows.map((item) => item.demand),
        y: rows.map((item) => item.capacity),
        text: rows.map((item) => item.id),
        textposition: "top center",
        name: sizeClass,
        marker: {
          size: 13,
          color: classPalette[sizeClass],
          line: {
            color: "rgba(24, 50, 61, 0.34)",
            width: 1
          }
        },
        xaxis: "x",
        yaxis: "y",
        hovertemplate: "%{text}<br>Demand %{x} units<br>Auction node capacity %{y} units<extra></extra>"
      };
    }),
    {
      type: "histogram",
      x: scatterPoints.map((item) => item.demand),
      marker: { color: "rgba(15, 118, 110, 0.45)" },
      showlegend: false,
      xaxis: "x2",
      yaxis: "y2",
      hovertemplate: "Demand bin %{x}<br>Count %{y}<extra></extra>"
    },
    {
      type: "histogram",
      y: scatterPoints.map((item) => item.capacity),
      marker: { color: "rgba(217, 119, 6, 0.45)" },
      showlegend: false,
      xaxis: "x3",
      yaxis: "y3",
      hovertemplate: "Capacity bin %{y}<br>Count %{x}<extra></extra>",
      orientation: "h"
    }
  ];

  const layout = baseLayout({
    margin: { l: 52, r: 18, t: 10, b: 48 },
    xaxis: {
      domain: [0, 0.82],
      title: "Task demand (units)",
      gridcolor: COLORS.grid,
      zeroline: false
    },
    yaxis: {
      domain: [0, 0.82],
      title: "Auction-selected node capacity (units)",
      gridcolor: COLORS.grid,
      zeroline: false
    },
    xaxis2: {
      domain: [0, 0.82],
      anchor: "y2",
      showticklabels: false,
      zeroline: false
    },
    yaxis2: {
      domain: [0.84, 1],
      anchor: "x2",
      showticklabels: false,
      zeroline: false
    },
    xaxis3: {
      domain: [0.84, 1],
      anchor: "y3",
      showticklabels: false,
      zeroline: false
    },
    yaxis3: {
      domain: [0, 0.82],
      anchor: "x3",
      showticklabels: false,
      zeroline: false
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.12
    }
  });

  Plotly.newPlot(target, traces, layout, plotConfig());
}

function renderPerformanceBarPlot(data) {
  const target = document.getElementById("performanceBarPlot");
  if (!target) {
    return;
  }

  const metrics = [
    "Utilization %",
    "Task assignment %",
    "Tasks placed",
    "Residual units",
    "Fairness index"
  ];

  const staticValues = [
    data.performanceAverage.static.resourceUtilizationRate,
    data.performanceAverage.static.taskAssignmentRate,
    data.performanceAverage.static.tasksSuccessfullyPlaced,
    data.performanceAverage.static.residualFragmentationUnits,
    data.performanceAverage.static.fairnessIndex
  ];

  const auctionValues = [
    data.performanceAverage.auction.resourceUtilizationRate,
    data.performanceAverage.auction.taskAssignmentRate,
    data.performanceAverage.auction.tasksSuccessfullyPlaced,
    data.performanceAverage.auction.residualFragmentationUnits,
    data.performanceAverage.auction.fairnessIndex
  ];

  const traces = [
    {
      type: "bar",
      x: metrics,
      y: staticValues,
      name: "Static",
      marker: { color: COLORS.coral }
    },
    {
      type: "bar",
      x: metrics,
      y: auctionValues,
      name: "Auction",
      marker: { color: COLORS.teal }
    }
  ];

  const layout = baseLayout({
    margin: { l: 44, r: 16, t: 8, b: 76 },
    barmode: "group",
    xaxis: {
      tickangle: -18
    },
    yaxis: {
      title: "Reported value",
      gridcolor: COLORS.grid,
      zeroline: false
    }
  });

  Plotly.newPlot(target, traces, layout, plotConfig());
}

function renderEfficiencyTrend(data) {
  const target = document.getElementById("efficiencyTrendPlot");
  if (!target) {
    return;
  }

  const taskCounts = data.taskVolumeEfficiencyApprox.taskCounts;
  const traces = [
    {
      type: "scatter",
      mode: "lines+markers",
      x: taskCounts,
      y: data.taskVolumeEfficiencyApprox.staticUtilizationPercent,
      name: "Static",
      line: {
        color: COLORS.coral,
        width: 3,
        dash: "dash"
      },
      marker: {
        size: 9
      }
    },
    {
      type: "scatter",
      mode: "lines+markers",
      x: taskCounts,
      y: data.taskVolumeEfficiencyApprox.auctionUtilizationPercent,
      name: "Auction",
      line: {
        color: COLORS.teal,
        width: 3
      },
      marker: {
        size: 9
      }
    }
  ];

  const layout = baseLayout({
    margin: { l: 48, r: 18, t: 8, b: 52 },
    xaxis: {
      title: "Number of tasks",
      dtick: 5,
      gridcolor: COLORS.grid,
      zeroline: false
    },
    yaxis: {
      title: "Utilization efficiency (%)",
      range: [60, 100],
      gridcolor: COLORS.grid,
      zeroline: false
    }
  });

  Plotly.newPlot(target, traces, layout, plotConfig());
}

function baseLayout(overrides = {}) {
  return {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: {
      family: "Manrope, sans-serif",
      color: COLORS.ink
    },
    hoverlabel: {
      bgcolor: "#112b35",
      font: {
        family: "Manrope, sans-serif"
      }
    },
    margin: {
      l: 40,
      r: 20,
      t: 20,
      b: 40
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.08
    },
    ...overrides
  };
}

function plotConfig() {
  return {
    displayModeBar: false,
    responsive: true
  };
}

function aggregateDemandByClass(tasks) {
  return tasks.reduce((accumulator, task) => {
    accumulator[task.sizeClass] = (accumulator[task.sizeClass] || 0) + task.demandUnits;
    return accumulator;
  }, {});
}

function findTaskPlacement(mapping, taskId) {
  return Object.entries(mapping).find(([, tasks]) => tasks.includes(taskId))?.[0] || "Unallocated";
}

function lookupNodeCapacity(data, placement) {
  const node = data.nodes.find((item) => item.id === placement);
  return node ? node.representativeCapacityUnits : null;
}

function buildTaskInterpretation(task, staticPlacement, auctionPlacement) {
  if (staticPlacement === "Unallocated" && auctionPlacement !== "Unallocated") {
    return `${task.id} is rejected by the static baseline but placed under the auction policy.`;
  }

  if (staticPlacement === auctionPlacement) {
    return `${task.id} lands on the same node in both reported strategies.`;
  }

  return `${task.id} is rerouted from ${formatPlacement(staticPlacement)} to ${formatPlacement(auctionPlacement)} by the auction policy.`;
}

function formatPlacement(placement) {
  return placement === "Unallocated" ? "Unallocated" : `Node ${placement}`;
}

function formatCapacity(capacity) {
  return capacity ? `Representative capacity: ${capacity} units` : "No node capacity because the task is unallocated.";
}

function gaussianKde(samples, x, bandwidth) {
  const coefficient = 1 / (samples.length * bandwidth * Math.sqrt(2 * Math.PI));
  return samples.reduce((sum, sample) => {
    const scaled = (x - sample) / bandwidth;
    return sum + Math.exp(-0.5 * scaled * scaled);
  }, 0) * coefficient;
}

function buildRange(start, stop, step) {
  const result = [];
  for (let value = start; value <= stop; value += step) {
    result.push(Number(value.toFixed(2)));
  }
  return result;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function renderLoadError(error) {
  const message = `Data load failed: ${error.message}`;
  document.querySelectorAll(".plot-surface").forEach((node) => {
    node.innerHTML = `<div class="task-explorer">${escapeHtml(message)}</div>`;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
