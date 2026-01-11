const fileInput = document.getElementById("file-input");
const fileList = document.getElementById("file-list");
const queueCount = document.getElementById("queue-count");
const startBtn = document.getElementById("start-btn");
const clearBtn = document.getElementById("clear-btn");

const queue = [];
let activeUploads = 0;
const MAX_CONCURRENT = 3;

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function updateQueueCount() {
  queueCount.textContent = `${queue.length} file${queue.length === 1 ? "" : "s"}`;
}

function createListItem(file) {
  const item = document.createElement("li");
  item.className = "file-item";

  const name = document.createElement("div");
  name.className = "file-name";
  name.textContent = file.name;

  const meta = document.createElement("div");
  meta.className = "file-meta";
  meta.textContent = formatBytes(file.size);

  const progress = document.createElement("div");
  progress.className = "progress";
  const bar = document.createElement("span");
  progress.appendChild(bar);

  const status = document.createElement("div");
  status.className = "status";
  status.textContent = "Waiting";

  item.appendChild(name);
  item.appendChild(meta);
  item.appendChild(progress);
  item.appendChild(status);

  fileList.appendChild(item);

  return { item, bar, status };
}

function enqueueFiles(files) {
  Array.from(files).forEach((file) => {
    const ui = createListItem(file);
    queue.push({ file, ui, state: "queued" });
  });
  updateQueueCount();
}

function uploadNext() {
  while (activeUploads < MAX_CONCURRENT) {
    const next = queue.find((item) => item.state === "queued");
    if (!next) return;
    startUpload(next);
  }
}

function startUpload(entry) {
  entry.state = "uploading";
  activeUploads += 1;
  entry.ui.status.textContent = "Uploading...";

  const formData = new FormData();
  formData.append("files", entry.file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload");

  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      entry.ui.bar.style.width = `${percent}%`;
    }
  });

  xhr.addEventListener("load", () => {
    activeUploads -= 1;
    if (xhr.status >= 200 && xhr.status < 300) {
      entry.state = "done";
      entry.ui.bar.style.width = "100%";
      entry.ui.status.textContent = "Uploaded";
      entry.ui.status.classList.add("ok");
    } else {
      entry.state = "error";
      entry.ui.status.textContent = `Failed (${xhr.status})`;
      entry.ui.status.classList.add("error");
    }
    updateQueueCount();
    uploadNext();
  });

  xhr.addEventListener("error", () => {
    activeUploads -= 1;
    entry.state = "error";
    entry.ui.status.textContent = "Network error";
    entry.ui.status.classList.add("error");
    updateQueueCount();
    uploadNext();
  });

  xhr.send(formData);
}

fileInput.addEventListener("change", (event) => {
  if (event.target.files.length) {
    enqueueFiles(event.target.files);
    event.target.value = "";
  }
});

startBtn.addEventListener("click", () => {
  uploadNext();
});

clearBtn.addEventListener("click", () => {
  queue.length = 0;
  fileList.innerHTML = "";
  updateQueueCount();
});

["dragenter", "dragover"].forEach((name) => {
  document.addEventListener(name, (event) => {
    event.preventDefault();
  });
});

["dragleave", "drop"].forEach((name) => {
  document.addEventListener(name, (event) => {
    event.preventDefault();
  });
});

document.addEventListener("drop", (event) => {
  if (event.dataTransfer && event.dataTransfer.files.length) {
    enqueueFiles(event.dataTransfer.files);
  }
});
