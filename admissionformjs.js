document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration ---
    // !!! PASTE YOUR DEPLOYED WEB APP URL HERE !!!
    const scriptURL = "https://script.google.com/macros/s/AKfycbzEk8K1oQLl8B0GXAiCmafZ7n5j-cT1hx_bCUvQi-IjerNOt0gVpYwYwOPKnicRddx9RA/exec"; // Replace with your actual URL
    const appsScriptWebAppURL = scriptURL; // Base URL for receipts & downloads
    const razorpayPaymentPageBaseURL = "https://pages.razorpay.com/hav25"; // Replace with your payment link if needed

    // --- Logo Paths ---
    const leftLogoPath = "images/hav05.jpg"; // আপনার বাম লোগোর পাথ
    const rightLogoPath = "images/hav05.jpg"; // আপনার ডান লোগোর পাথ

    // --- DOM Elements ---
    const form = document.getElementById('admission-form');
    const submitButton = document.getElementById('submit-button');
    const submitButtonGroup = document.querySelector('.submit-group');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message');
    const previewSection = document.getElementById('preview-section');
    const previewContentDiv = document.getElementById('preview-content');
    const finalSubmitButton = document.getElementById('final-submit-button');
    const editButton = document.getElementById('edit-button');
    const declarationPreviewCheckbox = document.getElementById('declaration-check-preview');
    const postSubmitArea = document.getElementById('post-submit-area');
    // const paymentSectionDiv = document.getElementById('payment-section'); // Unused?
    const backLoginLink = document.getElementById('back-login-link');
    // const formNumberDisplayArea = document.getElementById('form-number-display-area'); // Unused?
    const generatedFormNumberSpan = document.getElementById('generated-form-number');
    const actionFormNumberRefSpan = document.getElementById('action-form-number-ref');
    const admissionClassSelect = document.getElementById('admission_class');
    const streamGroupDiv = document.getElementById('stream-group');
    const streamSelect = document.getElementById('stream');
    const subjectSelectionAreaDiv = document.getElementById('subject-selection-area');
    const electiveSelect1 = document.getElementById('elective_subject_1');
    const electiveSelect2 = document.getElementById('elective_subject_2');
    const electiveSelect3 = document.getElementById('elective_subject_3');
    const optionalSelect = document.getElementById('optional_subject');
    const photoInput = document.getElementById('student_photo');
    const photoPreview = document.getElementById('photo-preview');
    const photoBase64Input = document.getElementById('photo_base64');
    const photoFilenameInput = document.getElementById('photo_filename');
    const photoMimetypeInput = document.getElementById('photo_mimetype');
    const casteSelect = document.getElementById('caste');
    const subCasteInput = document.getElementById('sub_caste');
    const subCasteLabelNote = document.getElementById('sub_caste_label_note');
    const previousMarksSection = document.getElementById('previous-marks-section');
    const prevMarksRequiredInputs = previousMarksSection ? previousMarksSection.querySelectorAll('#prev_board_name, #prev_passing_year, #prev_marks_bengali, #prev_marks_english, #prev_marks_mathematics, #prev_marks_physical_science, #prev_marks_life_science, #prev_marks_history, #prev_marks_geography') : [];
    const paymentButton = document.getElementById('payment-button');
    const downloadButton = document.getElementById('download-button'); // Still need the element reference even if hidden
    const printButton = document.getElementById('print-button');

    // --- Initial Checks ---
    if (!form || !submitButton || !previewSection || !previewContentDiv || !finalSubmitButton || !editButton || !admissionClassSelect || !declarationPreviewCheckbox || !postSubmitArea || !paymentButton || !downloadButton || !printButton || !streamGroupDiv || !streamSelect || !subjectSelectionAreaDiv || !previousMarksSection || !generatedFormNumberSpan || !actionFormNumberRefSpan) {
        console.error("FATAL: Core elements missing. Check HTML IDs.");
        if (errorMessageDiv) {
            errorMessageDiv.textContent = "Page Error: Required form elements missing. Cannot initialize.";
            errorMessageDiv.style.display = 'block';
        }
        return;
    }
    console.log("Initial core elements check passed.");

    // --- Subject Lists ---
    const artsSubjects = ["Computer Application", "Economics", "Geography", "History", "Philosophy", "Political Science", "Sanskrit"];
    const scienceSubjects = ["Mathematics", "Physics", "Chemistry", "Biology"];

    // --- Helper: Sanitize Data for Display ---
    function sanitize(str) {
        if (str === null || str === undefined) return '-';
        const temp = document.createElement('div');
        temp.textContent = String(str);
        return temp.innerHTML;
    }

    // --- Helper: Populate Dropdowns ---
    function populateDropdown(selectElement, optionsArray, defaultText, makeFirstSelected = true) {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = defaultText;
        defaultOption.disabled = true;
        if (makeFirstSelected) defaultOption.selected = true;
        selectElement.appendChild(defaultOption);
        optionsArray.forEach(optionText => {
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = optionText;
            selectElement.appendChild(option);
        });
        if (selectElement.id === 'optional_subject') {
            const noneOpt = document.createElement('option');
            noneOpt.value = "None";
            noneOpt.textContent = "None";
            if (defaultOption.nextSibling) selectElement.insertBefore(noneOpt, defaultOption.nextSibling);
            else selectElement.appendChild(noneOpt);
            if (!selectElement.value && !makeFirstSelected) {
                 const currentStream = streamSelect ? streamSelect.value : "";
                 if(currentStream === "Arts" || currentStream === "Science") noneOpt.selected = true;
            }
        }
    }

    // --- Handle Caste Change ---
    function handleCasteChange() {
        if (!casteSelect || !subCasteInput || !subCasteLabelNote) return;
        const selectedCaste = casteSelect.value;
        const requiredCastes = ['SC', 'ST', 'OBC-A', 'OBC-B'];
        const isRequired = requiredCastes.includes(selectedCaste);
        subCasteInput.required = isRequired;
        subCasteInput.placeholder = isRequired ? "Enter sub caste (Required)" : "Enter sub caste";
        subCasteLabelNote.textContent = isRequired ? "(Required)" : "(If applicable)";
    }

    // --- Handle Stream Change ---
	function handleStreamChange() {
        if (!streamSelect || !subjectSelectionAreaDiv || !electiveSelect1 || !electiveSelect2 || !electiveSelect3 || !optionalSelect) return;
        const selectedStream = streamSelect.value;
        const isStreamSelected = selectedStream === 'Arts' || selectedStream === 'Science';
        subjectSelectionAreaDiv.style.display = isStreamSelected ? 'block' : 'none';
        electiveSelect1.required = isStreamSelected;
        electiveSelect2.required = isStreamSelected;
        electiveSelect3.required = isStreamSelected;
        optionalSelect.required = false;
        if (isStreamSelected) {
            const currentSubjectList = selectedStream === 'Arts' ? artsSubjects : scienceSubjects;
            populateDropdown(electiveSelect1, currentSubjectList, 'Select Elective-I...', true);
            populateDropdown(electiveSelect2, currentSubjectList, 'Select Elective-II...', true);
            populateDropdown(electiveSelect3, currentSubjectList, 'Select Elective-III...', true);
            populateDropdown(optionalSelect, currentSubjectList, 'Select Optional...', false);
        } else {
            populateDropdown(electiveSelect1, [], 'Select...', true);
            populateDropdown(electiveSelect2, [], 'Select...', true);
            populateDropdown(electiveSelect3, [], 'Select...', true);
            populateDropdown(optionalSelect, [], 'Select Optional...', false);
        }
        if (electiveSelect1) electiveSelect1.value = '';
        if (electiveSelect2) electiveSelect2.value = '';
        if (electiveSelect3) electiveSelect3.value = '';
        if (optionalSelect) optionalSelect.value = 'None';
        updateSubjectDropdowns();
    }

    // --- Update Subject Dropdown Constraints ---
    function updateSubjectDropdowns() {
        if (!subjectSelectionAreaDiv || subjectSelectionAreaDiv.style.display !== 'block' || !electiveSelect1 || !electiveSelect2 || !electiveSelect3 || !optionalSelect) return;
        const selects = [electiveSelect1, electiveSelect2, electiveSelect3, optionalSelect];
        const selectedValues = { e1: electiveSelect1.value || null, e2: electiveSelect2.value || null, e3: electiveSelect3.value || null, opt: (optionalSelect.value && optionalSelect.value !== "None") ? optionalSelect.value : null };
        selects.forEach((currentSelect) => {
            if (!currentSelect) return;
            const otherSelectedValues = [];
            if (currentSelect !== electiveSelect1 && selectedValues.e1) otherSelectedValues.push(selectedValues.e1);
            if (currentSelect !== electiveSelect2 && selectedValues.e2) otherSelectedValues.push(selectedValues.e2);
            if (currentSelect !== electiveSelect3 && selectedValues.e3) otherSelectedValues.push(selectedValues.e3);
            if (currentSelect !== optionalSelect && selectedValues.opt) otherSelectedValues.push(selectedValues.opt);
            const thisSelectedValue = currentSelect.value || null;
            for (let i = 0; i < currentSelect.options.length; i++) {
                const option = currentSelect.options[i];
                if (!option) continue;
                const optionValue = option.value;
                if (!optionValue || optionValue === "None") { option.disabled = false; option.style.color = ''; option.style.backgroundColor = ''; continue; }
                let shouldBeDisabled = otherSelectedValues.includes(optionValue);
                if (optionValue === thisSelectedValue && thisSelectedValue !== null) shouldBeDisabled = false;
                option.disabled = shouldBeDisabled;
                option.style.color = shouldBeDisabled ? '#aaa' : '';
                option.style.backgroundColor = shouldBeDisabled ? '#f0f0f0' : '';
            }
        });
    }

    // --- Handle Class Change ---
     function handleClassChange() {
         if (!admissionClassSelect || !streamGroupDiv || !subjectSelectionAreaDiv || !streamSelect || !previousMarksSection || !electiveSelect1 || !electiveSelect2 || !electiveSelect3 || !optionalSelect) return;
         const selectedClass = admissionClassSelect.value;
         const isClassXIOrXII = (selectedClass === 'XI' || selectedClass === 'XII');
         streamGroupDiv.style.display = isClassXIOrXII ? 'block' : 'none';
         previousMarksSection.style.display = isClassXIOrXII ? 'block' : 'none';
         subjectSelectionAreaDiv.style.display = 'none';
         streamSelect.required = isClassXIOrXII;
         electiveSelect1.required = false; electiveSelect2.required = false; electiveSelect3.required = false; optionalSelect.required = false;
         prevMarksRequiredInputs.forEach(input => { if (input) { input.required = isClassXIOrXII; if (!isClassXIOrXII) input.value = ''; } });
         const prevOptionalInput = document.getElementById('prev_marks_optional');
         if (prevOptionalInput) { prevOptionalInput.required = false; if (!isClassXIOrXII) prevOptionalInput.value = ''; }
         if (!isClassXIOrXII) streamSelect.value = "";
         handleStreamChange(); // Update subjects based on new class selection
         console.log(`Class changed to ${selectedClass}. XI/XII sections visible: ${isClassXIOrXII}`);
     }

    // --- Handle File Reading for Base64 ---
    function getFileBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error("No file provided"));
            const reader = new FileReader(); reader.readAsDataURL(file);
            reader.onload = () => {
                const dataUrl = reader.result; if (!dataUrl || typeof dataUrl !== 'string') return reject(new Error("Invalid data URL"));
                const parts = dataUrl.split(','); if (parts.length !== 2) return reject(new Error("Malformed data URL"));
                const base64String = parts[1]; const mimeTypeMatch = parts[0].match(/^data:(.+);base64/); const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : file.type || 'application/octet-stream';
                if (!base64String) return reject(new Error("Could not extract Base64"));
                resolve({ base64: base64String, filename: file.name, mimetype: mimeType });
            }; reader.onerror = error => reject(error || new Error("FileReader error"));
        });
    }

    // --- Handle File Preview ---
    if (photoInput) {
        photoInput.addEventListener('change', function(event) {
            if (!photoPreview || !errorMessageDiv || !photoBase64Input || !photoFilenameInput || !photoMimetypeInput) return;
            const file = event.target.files ? event.target.files[0] : null;
            photoBase64Input.value = ''; photoFilenameInput.value = ''; photoMimetypeInput.value = '';
            photoPreview.style.display = 'none'; photoPreview.src = '#';
            if (file) {
                const maxSizeMB = 5; if (file.size > maxSizeMB * 1024 * 1024) { errorMessageDiv.textContent = `Photo max ${maxSizeMB} MB.`; errorMessageDiv.style.display = 'block'; photoInput.value = ''; return; }
                errorMessageDiv.style.display = 'none'; const reader = new FileReader();
                reader.onload = (e) => { if (e.target && e.target.result) { photoPreview.src = e.target.result; photoPreview.style.display = 'block'; } else { errorMessageDiv.textContent = 'Error displaying preview.'; errorMessageDiv.style.display = 'block'; photoPreview.style.display = 'none';} };
                reader.onerror = () => { errorMessageDiv.textContent = 'Error reading photo file.'; errorMessageDiv.style.display = 'block'; photoPreview.style.display = 'none'; };
                reader.readAsDataURL(file);
            }
        });
    } else { console.warn("Photo input not found."); }

    // --- Generate Preview HTML (Using "Label : Value" layout) ---
    function generateReceiptPreviewHTML(formData) {
        if (!formData) return "<p>Error: Preview data missing.</p>";
        console.log("Generating preview...");
        try {
            const data = Object.fromEntries(formData.entries());
            function createSimplePair(label, value) { const displayValue = (value === '0' || value === 0) ? '0' : ((value !== null && value !== undefined && value !== '') ? sanitize(value) : '-'); return `<p><span class="receipt-label">${sanitize(label)}</span> : <span class="receipt-value">${displayValue}</span></p>`; }
            function createSimpleInlinePair(label1, value1, label2, value2) { const displayValue1 = (value1 === '0' || value1 === 0) ? '0' : ((value1 !== null && value1 !== undefined && value1 !== '') ? sanitize(value1) : '-'); const displayValue2 = (value2 === '0' || value2 === 0) ? '0' : ((value2 !== null && value2 !== undefined && value2 !== '') ? sanitize(value2) : '-'); return `<p><span class="receipt-label">${sanitize(label1)}</span> : <span class="receipt-value">${displayValue1}</span><span class="receipt-inline-spacer"></span><span class="receipt-label">${sanitize(label2)}</span> : <span class="receipt-value">${displayValue2}</span></p>`; }
            const selectedClass = data.admission_class || ''; const currentStream = data.stream || ''; const isClassXIOrXII = (selectedClass === 'XI' || selectedClass === 'XII');
            const photoSrc = (photoPreview && photoPreview.style.display === 'block' && photoPreview.src && photoPreview.src !== '#') ? photoPreview.src : null;
            let formattedDob = '-'; if (data.dob) { try { const [y, m, d] = data.dob.split('-'); formattedDob = (d && m && y) ? `${d}-${m}-${y}` : sanitize(data.dob); } catch { formattedDob = sanitize(data.dob); } }
            let basicDetailsHTML = `${createSimplePair("Student Name", data.student_name)}${createSimplePair("Father Name", data.father_name)}${createSimplePair("Mother Name", data.mother_name)}${createSimplePair("Guardian Name", data.guardian_name)}${createSimplePair("Date of Birth", formattedDob)}${createSimplePair("Aadhaar Number", data.aadhaar_number)}${createSimplePair("Guardian Contact", data.guardian_contact)}${createSimplePair("Whatsapp Number", data.whatsapp_number)}${createSimpleInlinePair("Gender", data.gender, "Religion", data.religion)}${createSimpleInlinePair("Caste", data.caste, "Sub-Caste", data.sub_caste)}${createSimplePair("Guardian Occupation", data.guardian_occupation)}${createSimplePair("Annual Family Income", data.annual_family_income)}`;
            // Include Username/Password in preview ONLY if entered (for testing)
            if(data.username || data.password) {
                 basicDetailsHTML += `<div style='border:1px dashed red; margin-top:10px; padding: 5px;'><p style='color:red; font-weight:bold; text-align:center;'>Testing Only:</p>${createSimplePair("Username", data.username || '-')}${createSimplePair("Password", data.password ? '********' : '-')}</div>`; // Mask password in preview
            }
            let madhyamikHTML = '', subjectsHTML = '';
            if (isClassXIOrXII) { const hasMarksData = data.prev_board_name || data.prev_passing_year || data.prev_marks_bengali !== undefined; if (hasMarksData) { madhyamikHTML = `<h4 class="receipt-section-subtitle">Madhyamik Exam Marks, Board, & Years</h4>${createSimpleInlinePair("Board Name", data.prev_board_name, "Passing Years", data.prev_passing_year)}${createSimpleInlinePair("Bengali", data.prev_marks_bengali, "English", data.prev_marks_english)}${createSimpleInlinePair("Mathematics", data.prev_marks_mathematics, "Physical Sc.", data.prev_marks_physical_science)}${createSimpleInlinePair("History", data.prev_marks_history, "Life Sc.", data.prev_marks_life_science)}${createSimpleInlinePair("Geography", data.prev_marks_geography, "Optional", data.prev_marks_optional)}`; } if (currentStream) { subjectsHTML = `<h4 class="receipt-section-subtitle">Current Admission</h4>${createSimpleInlinePair("Admission Class", selectedClass, "Stream", currentStream)}${createSimplePair("Compulsory Language 1", data.compulsory_subject_1 || 'Bengali')}${createSimplePair("Compulsory Language 2", data.compulsory_subject_2 || 'English')}${createSimplePair("Compulsory Elective 1", data.elective_subject_1)}${createSimplePair("Compulsory Elective 2", data.elective_subject_2)}${createSimplePair("Compulsory Elective 3", data.elective_subject_3)}${(data.optional_subject && data.optional_subject !== 'None') ? createSimplePair('Optional Elective', data.optional_subject) : ''}`; } else { subjectsHTML = `<h4 class="receipt-section-subtitle">Current Admission</h4>${createSimplePair("Admission Class", selectedClass)}<p style="color:red; font-style: italic;">Stream not selected.</p>`; } } else { subjectsHTML = `<h4 class="receipt-section-subtitle">Current Admission</h4>${createSimplePair("Admission Class", selectedClass)}`; }
            let academicDetailsHTML = `${createSimplePair("Student BSP", data.student_bsp)}${createSimplePair("Previous School Name", data.previous_school_name)}${madhyamikHTML}${subjectsHTML}`;
            let addressDetailsHTML = `${createSimpleInlinePair("Village", data.village, "Post Office", data.post_office)}${createSimpleInlinePair("Police Station", data.police_station, "Dist.", data.district)}${createSimpleInlinePair("Pin Code", data.pin_code, "State", data.state)}`;
            let bankDetailsHTML = ''; if (data.bank_account_holder_name || data.bank_account_number || data.bank_ifsc_code || data.bank_name) { bankDetailsHTML = `${createSimplePair('Account Holder Name', data.bank_account_holder_name)}${createSimplePair('Account Number', data.bank_account_number)}${createSimplePair('IFSC Code', data.bank_ifsc_code ? sanitize(data.bank_ifsc_code).toUpperCase() : '-')}${createSimplePair('Bank Name', data.bank_name)}`; } else { bankDetailsHTML = `<p style="font-style: italic; text-align: center;">(Bank details not provided)</p>`; }
            const receiptHeaderHTML = `<div class="receipt-header"><img src="${leftLogoPath}" alt="Logo Left" class="logo-left"><img src="${rightLogoPath}" alt="Logo Right" class="logo-right"><div class="header-text"><h1>HEMTABAD ADARSHA VIDYALAYA (H.S)</h1><p>Address: Vill+P.O+P.S: Hemtabad, Dist.- Uttar Dinajpur, 733130</p><p>Contact: 7586089284, e-mail: <a href="mailto:hemtabadadrsha1930@gmail.com">hemtabadadrsha1930@gmail.com</a></p></div></div>`;
            const photoElementHTML = `<div class="receipt-photo">${photoSrc ? `<img src="${photoSrc}" alt="Student Photo">` : `<span>Photo Preview</span>`}</div>`; const titleHTML = `<h2 class="receipt-main-title-preview">Please Review Your Application Form</h2>`; const footerHTML = `<div class="receipt-footer-preview">*Please check your application thoroughly before final submission. No edits will
be possible after the application has been submitted*</div>`;
            return `<div class="receipt-container">${receiptHeaderHTML}${photoElementHTML}${titleHTML}<div class="receipt-grid"><div class="receipt-box receipt-basic"><h3>Student Basic Details</h3>${basicDetailsHTML}</div><div class="receipt-box receipt-academic"><h3>Academic Details</h3>${academicDetailsHTML}</div><div class="receipt-box receipt-address"><h3>Student Address Details</h3>${addressDetailsHTML}</div><div class="receipt-box receipt-bank"><h3>Student Bank Details</h3>${bankDetailsHTML}</div></div>${footerHTML}</div>`;
        } catch (error) { console.error("Preview error:", error); return `<p style="color: red;">Preview error: ${error.message}.</p>`; }
    }

    // --- Handle Form Submission (Step 1: Validation & Preview) ---
    async function handleFormSubmit(event) {
        if (event) event.preventDefault();
        if (!form || !errorMessageDiv || !previewContentDiv || !previewSection || !submitButtonGroup || !backLoginLink || !declarationPreviewCheckbox || !finalSubmitButton || !photoInput) return;
        errorMessageDiv.style.display = 'none'; errorMessageDiv.textContent = '';
        finalSubmitButton.disabled = true; declarationPreviewCheckbox.checked = false;
        // Add required check for username/password IF they are mandatory
        // if (!form.querySelector('#username').value || !form.querySelector('#password').value) {
        //    errorMessageDiv.textContent = 'Username and Password required.'; errorMessageDiv.style.display = 'block'; return;
        // }
        if (!form.checkValidity()) { form.reportValidity(); const firstInvalid = form.querySelector(':invalid:not(#username):not(#password)'); if (firstInvalid) {firstInvalid.focus(); firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });} errorMessageDiv.textContent = 'Please fill all required (*) fields correctly.'; errorMessageDiv.style.display = 'block'; return; }
        if (casteSelect && subCasteInput && subCasteInput.required && !subCasteInput.value.trim()) { errorMessageDiv.textContent = 'Sub Caste is required.'; errorMessageDiv.style.display = 'block'; subCasteInput.focus(); return; }
        const selectedClassValue = admissionClassSelect ? admissionClassSelect.value : ''; const isXIOrXII = (selectedClassValue === 'XI' || selectedClassValue === 'XII');
        if (isXIOrXII) { if (streamSelect && !streamSelect.value) { errorMessageDiv.textContent = 'Please select stream.'; errorMessageDiv.style.display = 'block'; streamSelect.focus(); return; } if (streamSelect && streamSelect.value && (!electiveSelect1 || !electiveSelect1.value || !electiveSelect2 || !electiveSelect2.value || !electiveSelect3 || !electiveSelect3.value)) { errorMessageDiv.textContent = 'Please select all three electives.'; errorMessageDiv.style.display = 'block'; if (!electiveSelect1.value) electiveSelect1.focus(); else if (!electiveSelect2.value) electiveSelect2.focus(); else if (electiveSelect3) electiveSelect3.focus(); return; } const electives = [electiveSelect1?.value, electiveSelect2?.value, electiveSelect3?.value].filter(Boolean); const optionalVal = optionalSelect ? optionalSelect.value : ''; if (streamSelect && streamSelect.value && optionalVal && optionalVal !== "None" && electives.includes(optionalVal)) { errorMessageDiv.textContent = 'Optional cannot be same as elective.'; errorMessageDiv.style.display = 'block'; optionalSelect.focus(); return; } let missingMark = false; prevMarksRequiredInputs.forEach(input => { if (input && input.required && input.value.trim() === '') missingMark = true; }); if (missingMark) { errorMessageDiv.textContent = 'Please fill previous marks.'; errorMessageDiv.style.display = 'block'; const firstEmptyMark = Array.from(prevMarksRequiredInputs).find(input => input && input.required && input.value.trim() === ''); if (firstEmptyMark) firstEmptyMark.focus(); return; } }
        if (!photoInput.files || photoInput.files.length === 0) { errorMessageDiv.textContent = "Please upload photo."; errorMessageDiv.style.display = 'block'; photoInput.focus(); return; }
        const photoFile = photoInput.files[0]; const maxSizeMB = 5; if (photoFile.size > maxSizeMB * 1024 * 1024) { errorMessageDiv.textContent = `Photo max ${maxSizeMB} MB.`; errorMessageDiv.style.display = 'block'; photoInput.focus(); return; }
        console.log("Validation passed. Generating preview...");
        try { const formDataForPreview = new FormData(form); const previewHTML = generateReceiptPreviewHTML(formDataForPreview); if(previewContentDiv) previewContentDiv.innerHTML = previewHTML; form.style.display = 'none'; if(submitButtonGroup) submitButtonGroup.style.display = 'none'; if(backLoginLink) backLoginLink.style.display = 'none'; previewSection.style.display = 'block'; errorMessageDiv.style.display = 'none'; window.scrollTo(0, 0); } catch (error) { console.error("Preview error:", error); errorMessageDiv.textContent = 'Preview error: ' + error.message; errorMessageDiv.style.display = 'block'; }
    }

    // --- Handle Final Submission (Step 2: Send Data) ---
    async function submitDataToServer() {
        if (!finalSubmitButton || !editButton || !loadingIndicator || !errorMessageDiv || !photoInput || !photoBase64Input || !photoFilenameInput || !photoMimetypeInput || !form || !previewSection || !postSubmitArea || !backLoginLink || !generatedFormNumberSpan || !actionFormNumberRefSpan || !paymentButton || !downloadButton || !printButton || !declarationPreviewCheckbox) return;
        if (!declarationPreviewCheckbox.checked) { errorMessageDiv.textContent = 'Please check declaration box.'; errorMessageDiv.style.display = 'block'; declarationPreviewCheckbox.focus(); return; }
        finalSubmitButton.disabled = true; editButton.disabled = true; loadingIndicator.style.display = 'block'; errorMessageDiv.style.display = 'none';
        if (!scriptURL || scriptURL.includes("YOUR_APPS_SCRIPT_URL") || !scriptURL.startsWith('https://script.google.com/macros/s/')) { errorMessageDiv.textContent = 'Error: Backend URL missing.'; errorMessageDiv.style.display = 'block'; finalSubmitButton.disabled = false; editButton.disabled = false; loadingIndicator.style.display = 'none'; return; }
        if (!photoInput.files || photoInput.files.length === 0) { errorMessageDiv.textContent = 'Error: Photo missing.'; errorMessageDiv.style.display = 'block'; finalSubmitButton.disabled = false; editButton.disabled = false; loadingIndicator.style.display = 'none'; return; }

        try {
            console.log("Starting final submission...");
            const photoFile = photoInput.files[0]; const photoData = await getFileBase64(photoFile);
            photoBase64Input.value = photoData.base64; photoFilenameInput.value = photoData.filename; photoMimetypeInput.value = photoData.mimetype;
            console.log("Photo Base64 generated.");
            const formData = new FormData(form); const selectedClass = formData.get('admission_class'); const isClassXIOrXII = (selectedClass === 'XI' || selectedClass === 'XII');
            const fieldsToRemoveIfNotXI = ['stream', 'elective_subject_1', 'elective_subject_2', 'elective_subject_3', 'optional_subject', 'prev_board_name', 'prev_passing_year', 'prev_marks_bengali', 'prev_marks_english', 'prev_marks_mathematics', 'prev_marks_physical_science', 'prev_marks_life_science', 'prev_marks_history', 'prev_marks_geography', 'prev_marks_optional'];
            if (!isClassXIOrXII) { fieldsToRemoveIfNotXI.forEach(fieldName => formData.delete(fieldName)); console.log("Removed XI/XII fields."); }
            else { if (formData.get('optional_subject') === 'None') formData.set('optional_subject', ''); if (!formData.get('prev_marks_optional')) formData.delete('prev_marks_optional'); console.log("Kept XI/XII fields."); }
            // Username/Password are sent regardless of class
            formData.delete('student_photo'); console.log("FormData prepared, sending...");

            const response = await fetch(scriptURL, { method: 'POST', body: formData });
            console.log("Response status:", response.status);
            if (!response.ok) { let errorBody = `Server error: ${response.status}.`; try { const text = await response.text(); errorBody += ` Details: ${text}`; } catch(e){} throw new Error(errorBody); }
            const result = await response.json(); console.log("Response JSON:", result);

            if (result.status === 'success' && result.uniqueId) {
                const uniqueId = result.uniqueId; console.log("Success! ID:", uniqueId);
                const paymentUrl = razorpayPaymentPageBaseURL;
                const receiptViewUrl = `${appsScriptWebAppURL}?action=getReceipt&id=${uniqueId}`;
                // PDF Download is removed, so no URL needed for it
                // const pdfDownloadUrl = `${appsScriptWebAppURL}?action=downloadPdf&id=${uniqueId}`;
                console.log("View URL:", receiptViewUrl);

                previewSection.style.display = 'none'; loadingIndicator.style.display = 'none'; postSubmitArea.style.display = 'block'; backLoginLink.style.display = 'none';
                generatedFormNumberSpan.textContent = uniqueId; actionFormNumberRefSpan.textContent = uniqueId;
                if (paymentButton) { paymentButton.href = paymentUrl; paymentButton.style.display = 'inline-block'; }
                // Download Button - Hide it
                if (downloadButton) {
                    downloadButton.style.display = 'none';
                }
                if (printButton) { printButton.href = receiptViewUrl; printButton.target = '_blank'; printButton.style.display = 'inline-block'; }
                window.scrollTo(0, 0);
            } else { throw new Error(result.message || 'Submission failed/invalid response.'); }
        } catch (error) {
            console.error('Final Submission Error:', error); errorMessageDiv.textContent = 'Submission Error: ' + error.message; errorMessageDiv.style.display = 'block';
            if(finalSubmitButton) finalSubmitButton.disabled = false; if(editButton) editButton.disabled = false; if(loadingIndicator) loadingIndicator.style.display = 'none';
            if(photoBase64Input) photoBase64Input.value = ''; if(photoFilenameInput) photoFilenameInput.value = ''; if(photoMimetypeInput) photoMimetypeInput.value = '';
            window.scrollTo(0, 0);
        }
    }

    // --- Handle Edit Button Click ---
    function handleEdit() {
        if (!previewSection || !postSubmitArea || !errorMessageDiv || !form || !submitButtonGroup || !backLoginLink || !finalSubmitButton || !editButton || !declarationPreviewCheckbox || !photoBase64Input || !photoFilenameInput || !photoMimetypeInput ) return;
        previewSection.style.display = 'none'; postSubmitArea.style.display = 'none'; errorMessageDiv.style.display = 'none';
        form.style.display = 'block'; submitButtonGroup.style.display = 'block'; backLoginLink.style.display = 'block';
        declarationPreviewCheckbox.checked = false; finalSubmitButton.disabled = true; editButton.disabled = false;
        photoBase64Input.value = ''; photoFilenameInput.value = ''; photoMimetypeInput.value = '';
        window.scrollTo(0, 0); console.log("Switched back to form edit mode.");
    }

    // --- Attach Event Listeners ---
    if (form) form.addEventListener('submit', handleFormSubmit);
    if (finalSubmitButton) finalSubmitButton.addEventListener('click', submitDataToServer);
    if (editButton) editButton.addEventListener('click', handleEdit);
    if (declarationPreviewCheckbox) { declarationPreviewCheckbox.addEventListener('change', function() { if (finalSubmitButton) { finalSubmitButton.disabled = !this.checked; if (this.checked && errorMessageDiv && errorMessageDiv.textContent.includes('declaration box')) { errorMessageDiv.style.display = 'none'; } } }); }
    if (casteSelect) casteSelect.addEventListener('change', handleCasteChange);
    if (admissionClassSelect) admissionClassSelect.addEventListener('change', handleClassChange);
    if (streamSelect) streamSelect.addEventListener('change', handleStreamChange);
    if (electiveSelect1) electiveSelect1.addEventListener('change', updateSubjectDropdowns);
    if (electiveSelect2) electiveSelect2.addEventListener('change', updateSubjectDropdowns);
    if (electiveSelect3) electiveSelect3.addEventListener('change', updateSubjectDropdowns);
    if (optionalSelect) optionalSelect.addEventListener('change', updateSubjectDropdowns);

    // --- Run Initial Setup ---
    console.log("Running initial setup...");
    try { handleClassChange(); handleCasteChange(); console.log("Initial setup complete."); }
    catch (err) { console.error("Initial setup error:", err); if (errorMessageDiv) { errorMessageDiv.textContent = "Page init error: " + err.message; errorMessageDiv.style.display = 'block'; } }

}); // <<<--- End of JS file
