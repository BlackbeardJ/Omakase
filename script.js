document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const selectedTimeInput = document.getElementById('selectedTime');
    const reservationForm = document.getElementById('reservationForm');
    const submitReservationBtn = document.getElementById('submitReservationBtn');
    const loadingSlotsMessage = document.getElementById('loading-slots-message');
    const noSlotsMessage = document.getElementById('no-slots-message');
    const formMessage = document.getElementById('form-message');

    let selectedTime = null; // Stores the actual time string (e.g., "18:30")

    // --- Smooth scrolling for internal links (copied from previous discussion) ---
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    const header = document.querySelector('.main-header');

    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Only prevent default if it's an internal hash link on the CURRENT page
            // This allows links like 'index.html#about-us-section' to work as normal
            if (this.pathname === window.location.pathname) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    history.pushState(null, null, targetId);
                }
            }
        });
    });


    // Event listener for date change
    dateInput.addEventListener('change', (event) => {
        const selectedDateValue = event.target.value;
        fetchAndDisplayTimeSlots(selectedDateValue);
    });

    // Event listener for time slot selection
    timeSlotsContainer.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.time-slot');
        if (clickedButton) {
            // Remove 'selected' from all other slots
            document.querySelectorAll('.time-slot').forEach(btn => btn.classList.remove('selected'));

            // Add 'selected' to the clicked slot
            clickedButton.classList.add('selected');
            selectedTime = clickedButton.getAttribute('data-time');
            selectedTimeInput.value = selectedTime; // Update hidden input
            submitReservationBtn.disabled = false; // Enable submit button
        }
    });

    // Event listener for form submission
    reservationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        if (!selectedTime) {
            displayFormMessage('Please select a time slot.', 'error');
            return;
        }

        // Gather form data
        const formData = {
            date: dateInput.value,
            time: selectedTime, // Use the actual selected time
            guests: document.getElementById('guests').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            notes: document.getElementById('notes').value,
        };

        submitReservationBtn.disabled = true;
        submitReservationBtn.textContent = 'Processing...';
        formMessage.style.display = 'none'; // Hide previous messages

        try {
            // *** THIS IS THE API CALL TO YOUR BACKEND ***
            // Replace with your actual backend endpoint
            const response = await fetch('/api/make-reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'X-CSRF-Token': 'your-csrf-token' // If you have CSRF protection
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                displayFormMessage('Your reservation has been successfully placed! A confirmation email will be sent shortly.', 'success');
                reservationForm.reset(); // Clear the form
                selectedTime = null; // Reset selected time
                selectedTimeInput.value = '';
                fetchAndDisplayTimeSlots(dateInput.value); // Re-fetch slots to update availability
            } else {
                // Backend error (e.g., slot no longer available, validation error)
                displayFormMessage(`Reservation failed: ${result.message || 'An unknown error occurred.'}`, 'error');
                // If slot was taken, re-fetch slots
                if (result.code === 'SLOT_TAKEN') { // Example error code
                    fetchAndDisplayTimeSlots(dateInput.value);
                }
            }
        } catch (error) {
            console.error('Network error during reservation:', error);
            displayFormMessage('A network error occurred. Please check your internet connection.', 'error');
        } finally {
            submitReservationBtn.disabled = false;
            submitReservationBtn.textContent = 'Confirm Reservation';
        }
    });

    function displayFormMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`; // Adds 'success' or 'error' class
        formMessage.style.display = 'block';
        // Scroll to message for visibility
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});