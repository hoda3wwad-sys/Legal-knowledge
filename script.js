const form = document.getElementById("researchForm");
const entriesContainer = document.getElementById("entriesList") || document.getElementById("entries");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const clearFiltersButton = document.getElementById("clearFilters");
const researchCount = document.getElementById("researchCount");
const summaryText = document.getElementById("summaryText");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

const locale = {
  badgeText: "نسخة تجريبية",
  formSectionTitle: "أضِف بحث جديد",
  formSectionDesc: "اكتب بيانات البحث ورفعه مباشرة إلى الخادم.",
  labelName: "الاسم الكامل",
  placeholderName: "اكتب اسمك هنا",
  labelRole: "المهنة",
  roleOptionAll: "اختر",
  roleOptionLawyer: "محامٍ",
  roleOptionDoctor: "دكتور جامعة",
  roleOptionResearcher: "باحث",
  roleOptionOther: "أخرى",
  labelTitle: "عنوان البحث",
  placeholderTitle: "عنوان البحث",
  labelAbstract: "ملخص البحث",
  placeholderAbstract: "اكتب وصفاً موجزاً للبحث",
  labelFile: "تحميل ملف البحث (PDF أو Word)",
  submitButton: "نشر البحث",
  publishedTitle: "الأبحاث المنشورة",
  searchPlaceholder: "ابحث بالاسم أو عنوان البحث",
  researchCount: "عدد الأبحاث:",
  clearFilters: "إعادة تعيين",
  emptyMessage: "لا يوجد أبحاث حتى الآن. كن أول من ينشر.",
  noMatch: "لا توجد أبحاث تطابق بحثك الحالي.",
  summarySearch: "يمكنك البحث أو تصفية الأبحاث حسب المهنة.",
  delete: "حذف",
  deleteConfirm: "هل تريد حذف هذا البحث فعلاً؟",
  missingFields: "يرجى ملء الاسم، المهنة، واسم البحث.",
  fileSizeMessage: "الملف كبير جداً. الرجاء اختيار ملف أصغر من 10 ميجابايت.",
  submitError: "حدث خطأ أثناء إرسال البحث. حاول مرة أخرى.",
  serverUnavailable: "الخادم غير متاح حالياً.",
  fetchError: "فشل جلب الأبحاث من الخادم.",
  deleteErrorFetch: "فشل حذف البحث.",
};

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function filterEntries(entries) {
  const searchText = searchInput?.value.trim().toLowerCase() || "";
  const roleValue = roleFilter?.value || "";

  return entries.filter((entry) => {
    const matchesRole = !roleValue || entry.role === roleValue;
    const matchesSearch =
      !searchText ||
      entry.name.toLowerCase().includes(searchText) ||
      entry.title.toLowerCase().includes(searchText) ||
      entry.abstract.toLowerCase().includes(searchText);
    return matchesRole && matchesSearch;
  });
}

function renderEntries(entries) {
  if (!entriesContainer) return;

  const filteredEntries = filterEntries(entries);
  researchCount.textContent = `${locale.researchCount} ${filteredEntries.length}`;
  entriesContainer.innerHTML = "";

  if (!entries.length) {
    summaryText.textContent = locale.emptyMessage;
  } else if (!filteredEntries.length) {
    summaryText.textContent = locale.noMatch;
  } else {
    summaryText.textContent = locale.summarySearch;
  }

  if (!filteredEntries.length) {
    entriesContainer.innerHTML = `<p class="empty">${entries.length ? locale.noMatch : locale.emptyMessage}</p>`;
    return;
  }

  filteredEntries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry";

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = entry.title;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${entry.name} • ${entry.role} • ${formatDate(entry.createdAt)}`;
    header.append(title, meta);

    const abstract = document.createElement("p");
    abstract.textContent = entry.abstract || locale.emptyMessage;

    const controls = document.createElement("div");
    controls.className = "entry-controls";

    if (entry.fileName && entry.fileUrl) {
      const fileLink = document.createElement("a");
      fileLink.href = entry.fileUrl;
      fileLink.textContent = `تحميل الملف: ${entry.fileName}`;
      fileLink.target = "_blank";
      controls.appendChild(fileLink);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = locale.delete;
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteEntry(entry.id));
    controls.appendChild(deleteButton);

    card.append(header, abstract, controls);
    entriesContainer.appendChild(card);
  });
}

async function fetchEntries() {
  if (!entriesContainer) return;

  try {
    const response = await fetch("/api/research");
    if (!response.ok) {
      throw new Error(locale.fetchError);
    }
    const entries = await response.json();
    renderEntries(entries);
  } catch (error) {
    entriesContainer.innerHTML = `<p class="empty">${locale.serverUnavailable}</p>`;
    summaryText.textContent = locale.serverUnavailable;
    researchCount.textContent = `${locale.researchCount} 0`;
    console.error(error);
  }
}

async function deleteEntry(id) {
  if (!confirm(locale.deleteConfirm)) {
    return;
  }

  try {
    const response = await fetch(`/api/research/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(locale.deleteErrorFetch);
    }

    fetchEntries();
  } catch (error) {
    alert(locale.submitError);
    console.error(error);
  }
}

if (form) {
  const labelName = document.getElementById("labelName");
  const inputName = document.getElementById("name");
  const labelRole = document.getElementById("labelRole");
  const roleOptionAll = document.getElementById("roleOptionAll");
  const roleOptionLawyer = document.getElementById("roleOptionLawyer");
  const roleOptionDoctor = document.getElementById("roleOptionDoctor");
  const roleOptionResearcher = document.getElementById("roleOptionResearcher");
  const roleOptionOther = document.getElementById("roleOptionOther");
  const labelTitle = document.getElementById("labelTitle");
  const inputTitle = document.getElementById("title");
  const labelAbstract = document.getElementById("labelAbstract");
  const abstractInput = document.getElementById("abstract");
  const labelFile = document.getElementById("labelFile");
  const submitButton = document.getElementById("submitButton");

  if (labelName) labelName.textContent = locale.labelName;
  if (labelRole) labelRole.textContent = locale.labelRole;
  if (roleOptionAll) roleOptionAll.textContent = locale.roleOptionAll;
  if (roleOptionLawyer) roleOptionLawyer.textContent = locale.roleOptionLawyer;
  if (roleOptionDoctor) roleOptionDoctor.textContent = locale.roleOptionDoctor;
  if (roleOptionResearcher) roleOptionResearcher.textContent = locale.roleOptionResearcher;
  if (roleOptionOther) roleOptionOther.textContent = locale.roleOptionOther;
  if (labelTitle) labelTitle.textContent = locale.labelTitle;
  if (inputName) inputName.placeholder = locale.placeholderName;
  if (inputTitle) inputTitle.placeholder = locale.placeholderTitle;
  if (labelAbstract) labelAbstract.textContent = locale.labelAbstract;
  if (abstractInput) abstractInput.placeholder = locale.placeholderAbstract;
  if (labelFile) labelFile.textContent = locale.labelFile;
  if (submitButton) submitButton.textContent = locale.submitButton;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const role = form.role.value;
    const titleValue = form.title.value.trim();
    const abstract = form.abstract.value.trim();
    const fileInput = form.file.files[0];

    if (!name || !role || !titleValue) {
      alert(locale.missingFields);
      return;
    }

    if (fileInput && fileInput.size > 10 * 1024 * 1024) {
      alert(locale.fileSizeMessage);
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("role", role);
    formData.append("title", titleValue);
    formData.append("abstract", abstract);
    if (fileInput) {
      formData.append("file", fileInput);
    }

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || locale.submitError);
      }

      form.reset();
      fetchEntries();
    } catch (error) {
      alert(locale.submitError);
      console.error(error);
    }
  });
}

if (clearFiltersButton) {
  clearFiltersButton.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (roleFilter) roleFilter.value = "";
    fetchEntries();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", fetchEntries);
}

if (roleFilter) {
  roleFilter.addEventListener("change", fetchEntries);
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

if (entriesContainer) {
  fetchEntries();
}

