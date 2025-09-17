// Expense Tracker JavaScript

class ExpenseTracker {
    constructor() {
        this.currentProfile = this.loadCurrentProfile();
        this.profiles = this.loadProfiles();
        this.expenses = this.loadExpenses();
        this.initializeEventListeners();
        this.updateProfileSelector();
        this.updateDisplay();
        this.setDefaultDate();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Filter controls
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('monthFilter').addEventListener('change', () => {
            this.updateDisplay();
        });

        document.getElementById('accountFilter').addEventListener('change', () => {
            this.updateDisplay();
        });

        // Action buttons
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportExpenses();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllExpenses();
        });

        // Add context menu for additional delete options
        this.addContextMenu();

        // Profile management
        document.getElementById('profileSelect').addEventListener('change', (e) => {
            this.switchProfile(e.target.value);
        });

        document.getElementById('profileManageBtn').addEventListener('click', () => {
            this.showProfileManager();
        });
    }

    // Add context menu for delete options
    addContextMenu() {
        const clearAllBtn = document.getElementById('clearAllBtn');
        
        // Add long press or right-click functionality
        clearAllBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showDeleteOptionsMenu(e);
        });
    }

    // Show delete options menu
    showDeleteOptionsMenu(event) {
        // Remove existing menu if any
        const existingMenu = document.querySelector('.delete-options-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'delete-options-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="expenseTracker.clearAllExpenses()">
                <i class="fas fa-trash-alt"></i> Clear All Expenses
            </div>
            <div class="menu-item" onclick="expenseTracker.showCategoryDeleteMenu()">
                <i class="fas fa-filter"></i> Delete by Category
            </div>
            <div class="menu-item" onclick="expenseTracker.showDateDeleteMenu()">
                <i class="fas fa-calendar"></i> Delete by Date Range
            </div>
            <div class="menu-item" onclick="expenseTracker.deleteOldExpenses(6)">
                <i class="fas fa-clock"></i> Delete Older than 6 Months
            </div>
            <div class="menu-item" onclick="expenseTracker.deleteOldExpenses(12)">
                <i class="fas fa-calendar-alt"></i> Delete Older than 1 Year
            </div>
        `;

        // Position the menu
        menu.style.cssText = `
            position: fixed;
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 200px;
            padding: 8px 0;
            border: 1px solid #e2e8f0;
        `;

        // Add styles for menu items
        const style = document.createElement('style');
        style.textContent = `
            .delete-options-menu .menu-item {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #4a5568;
                font-size: 0.9rem;
                transition: background-color 0.2s;
            }
            .delete-options-menu .menu-item:hover {
                background: #f7fafc;
                color: #2d3748;
            }
            .delete-options-menu .menu-item i {
                width: 16px;
                text-align: center;
            }
        `;
        if (!document.querySelector('#delete-menu-styles')) {
            style.id = 'delete-menu-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
    }

    // Show category delete menu
    showCategoryDeleteMenu() {
        const categories = [...new Set(this.expenses.map(expense => expense.category))];
        
        if (categories.length === 0) {
            this.showNotification('No expenses found', 'error');
            return;
        }

        const categoryNames = {
            food: '🍽️ Food & Dining',
            transportation: '🚗 Transportation',
            shopping: '🛍️ Shopping',
            entertainment: '🎬 Entertainment',
            bills: '💡 Bills & Utilities',
            healthcare: '🏥 Healthcare',
            education: '📚 Education',
            other: '📝 Other'
        };

        const options = categories.map(cat => 
            `${categoryNames[cat]} (${this.expenses.filter(e => e.category === cat).length} expenses)`
        ).join('\n');

        const choice = prompt(`Select category to delete:\n\n${options}\n\nEnter the category name (e.g., 'food', 'shopping'):`);
        
        if (choice && categories.includes(choice)) {
            this.deleteExpensesByCategory(choice);
        } else if (choice) {
            this.showNotification('Invalid category selected', 'error');
        }
    }

    // Show date range delete menu
    showDateDeleteMenu() {
        const startDate = prompt('Enter start date (YYYY-MM-DD) or leave empty for all time:');
        const endDate = prompt('Enter end date (YYYY-MM-DD) or leave empty for today:');
        
        if (startDate && !this.isValidDate(startDate)) {
            this.showNotification('Invalid start date format', 'error');
            return;
        }
        
        if (endDate && !this.isValidDate(endDate)) {
            this.showNotification('Invalid end date format', 'error');
            return;
        }

        const start = startDate ? new Date(startDate + 'T00:00:00') : new Date('1900-01-01');
        const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

        const expensesToDelete = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date + 'T00:00:00');
            return expenseDate >= start && expenseDate <= end;
        });

        if (expensesToDelete.length === 0) {
            this.showNotification('No expenses found in the specified date range', 'error');
            return;
        }

        const totalAmount = expensesToDelete.reduce((sum, expense) => sum + expense.amount, 0);
        const confirmMessage = `Delete ${expensesToDelete.length} expenses from ${startDate || 'all time'} to ${endDate || 'today'} ($${totalAmount.toFixed(2)})?\n\nThis action cannot be undone!`;
        
        if (confirm(confirmMessage)) {
            this.expenses = this.expenses.filter(expense => {
                const expenseDate = new Date(expense.date + 'T00:00:00');
                return !(expenseDate >= start && expenseDate <= end);
            });
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification(`Deleted ${expensesToDelete.length} expenses`, 'success');
        }
    }

    // Validate date format
    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        const date = new Date(dateString + 'T00:00:00');
        return date.toISOString().startsWith(dateString);
    }

    // Profile Management Methods
    loadCurrentProfile() {
        return localStorage.getItem('expenseTracker_currentProfile') || 'personal';
    }

    loadProfiles() {
        const defaultProfiles = {
            personal: { name: '👤 Personal', emoji: '👤', color: '#667eea' },
            work: { name: '💼 Work', emoji: '💼', color: '#4299e1' },
            other: { name: '📝 Other', emoji: '📝', color: '#48bb78' }
        };
        
        const saved = localStorage.getItem('expenseTracker_profiles');
        return saved ? { ...defaultProfiles, ...JSON.parse(saved) } : defaultProfiles;
    }

    saveCurrentProfile(profileId) {
        localStorage.setItem('expenseTracker_currentProfile', profileId);
    }

    saveProfiles() {
        localStorage.setItem('expenseTracker_profiles', JSON.stringify(this.profiles));
    }

    switchProfile(profileId) {
        this.currentProfile = profileId;
        this.saveCurrentProfile(profileId);
        this.expenses = this.loadExpenses();
        this.updateProfileSelector();
        this.updateDisplay();
        this.showNotification(`Switched to ${this.profiles[profileId].name} profile`, 'success');
    }

    updateProfileSelector() {
        const profileSelect = document.getElementById('profileSelect');
        profileSelect.innerHTML = '';
        
        Object.entries(this.profiles).forEach(([id, profile]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = profile.name;
            if (id === this.currentProfile) {
                option.selected = true;
            }
            profileSelect.appendChild(option);
        });
    }

    showProfileManager() {
        // Remove existing modal if any
        const existingModal = document.querySelector('.profile-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Manage Profiles</h3>
                    <button class="close-btn" onclick="this.closest('.profile-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="profile-list" id="profileList">
                        ${Object.entries(this.profiles).map(([id, profile]) => `
                            <div class="profile-item ${id === this.currentProfile ? 'active' : ''}" data-profile-id="${id}">
                                <div class="profile-info">
                                    <span class="profile-emoji">${profile.emoji}</span>
                                    <span class="profile-name">${profile.name}</span>
                                </div>
                                <div class="profile-actions">
                                    <button class="btn btn-sm btn-primary" onclick="expenseTracker.switchProfile('${id}')">
                                        Switch
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="expenseTracker.editProfile('${id}')">
                                        Edit
                                    </button>
                                    ${Object.keys(this.profiles).length > 1 ? `
                                        <button class="btn btn-sm btn-danger" onclick="expenseTracker.deleteProfile('${id}')">
                                            Delete
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="expenseTracker.showAddProfileForm()">
                            <i class="fas fa-plus"></i> Add New Profile
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .profile-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
            }
            .modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-header h3 {
                margin: 0;
                color: #2d3748;
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 1.2rem;
                color: #a0aec0;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
            }
            .close-btn:hover {
                background: #f7fafc;
                color: #4a5568;
            }
            .modal-body {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            .profile-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }
            .profile-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                transition: all 0.3s ease;
            }
            .profile-item.active {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.05);
            }
            .profile-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .profile-emoji {
                font-size: 1.2rem;
            }
            .profile-name {
                font-weight: 500;
                color: #2d3748;
            }
            .profile-actions {
                display: flex;
                gap: 8px;
            }
            .btn-sm {
                padding: 6px 12px;
                font-size: 0.8rem;
            }
            .modal-actions {
                text-align: center;
            }
        `;
        if (!document.querySelector('#profile-modal-styles')) {
            style.id = 'profile-modal-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    editProfile(profileId) {
        const profile = this.profiles[profileId];
        const newName = prompt('Enter new profile name:', profile.name);
        if (newName && newName.trim() && newName !== profile.name) {
            this.profiles[profileId].name = newName.trim();
            this.saveProfiles();
            this.updateProfileSelector();
            this.showProfileManager(); // Refresh the modal
            this.showNotification('Profile updated successfully!', 'success');
        }
    }

    deleteProfile(profileId) {
        if (Object.keys(this.profiles).length <= 1) {
            this.showNotification('Cannot delete the last profile', 'error');
            return;
        }

        const profile = this.profiles[profileId];
        if (confirm(`Are you sure you want to delete the "${profile.name}" profile?\n\nThis will also delete all expenses in this profile!`)) {
            delete this.profiles[profileId];
            this.saveProfiles();
            
            // Switch to another profile if current one was deleted
            if (this.currentProfile === profileId) {
                const remainingProfiles = Object.keys(this.profiles);
                this.switchProfile(remainingProfiles[0]);
            }
            
            this.showNotification('Profile deleted successfully!', 'success');
        }
    }

    showAddProfileForm() {
        const name = prompt('Enter profile name:');
        if (name && name.trim()) {
            const emojis = ['🏠', '🎯', '⭐', '🔥', '💎', '🚀', '🎨', '🌟', '💫', '🎪'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            const profileId = 'profile_' + Date.now();
            
            this.profiles[profileId] = {
                name: name.trim(),
                emoji: randomEmoji,
                color: '#667eea'
            };
            
            this.saveProfiles();
            this.updateProfileSelector();
            this.showProfileManager(); // Refresh the modal
            this.showNotification('Profile created successfully!', 'success');
        }
    }

    // Set default date to today
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    // Add new expense
    addExpense() {
        const form = document.getElementById('expenseForm');
        const formData = new FormData(form);
        
        const expense = {
            id: Date.now().toString(),
            description: formData.get('description').trim(),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            account: formData.get('account'),
            date: formData.get('date')
        };

        // Validate form
        if (!expense.description || !expense.amount || !expense.category || !expense.account || !expense.date) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (expense.amount <= 0) {
            this.showNotification('Amount must be greater than 0', 'error');
            return;
        }

        // Add expense to array
        this.expenses.unshift(expense);
        
        // Save to localStorage
        this.saveExpenses();
        
        // Update display
        this.updateDisplay();
        
        // Reset form
        form.reset();
        this.setDefaultDate();
        
        // Show success notification
        this.showNotification('Expense added successfully!', 'success');
    }

    // Delete expense
    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification('Expense deleted successfully!', 'success');
        }
    }

    // Get filtered expenses
    getFilteredExpenses() {
        let filtered = [...this.expenses];
        
        // Filter by category
        const categoryFilter = document.getElementById('categoryFilter').value;
        if (categoryFilter) {
            filtered = filtered.filter(expense => expense.category === categoryFilter);
        }
        
        // Filter by account
        const accountFilter = document.getElementById('accountFilter').value;
        if (accountFilter) {
            filtered = filtered.filter(expense => expense.account === accountFilter);
        }
        
        // Filter by month
        const monthFilter = document.getElementById('monthFilter').value;
        if (monthFilter) {
            filtered = filtered.filter(expense => {
                // Parse the expense date as local date to avoid timezone issues
                const expenseDate = new Date(expense.date + 'T00:00:00');
                // Parse the filter date as local date
                const filterDate = new Date(monthFilter + '-01T00:00:00');
                return expenseDate.getFullYear() === filterDate.getFullYear() && 
                       expenseDate.getMonth() === filterDate.getMonth();
            });
        }
        
        return filtered;
    }

    // Update display
    updateDisplay() {
        this.updateExpensesList();
        this.updateSummary();
        this.updateAccountSummary();
        this.updateTotalBalance();
    }

    // Update expenses list
    updateExpensesList() {
        const expensesList = document.getElementById('expensesList');
        const filteredExpenses = this.getFilteredExpenses();
        
        if (filteredExpenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses found. ${this.expenses.length === 0 ? 'Add your first expense above!' : 'Try adjusting your filters.'}</p>
                </div>
            `;
            return;
        }

        expensesList.innerHTML = filteredExpenses.map(expense => this.createExpenseHTML(expense)).join('');
    }

    // Create expense HTML
    createExpenseHTML(expense) {
        const categoryEmojis = {
            food: '🍽️',
            transportation: '🚗',
            shopping: '🛍️',
            entertainment: '🎬',
            bills: '💡',
            healthcare: '🏥',
            education: '📚',
            other: '📝'
        };

        const categoryNames = {
            food: 'Food & Dining',
            transportation: 'Transportation',
            shopping: 'Shopping',
            entertainment: 'Entertainment',
            bills: 'Bills & Utilities',
            healthcare: 'Healthcare',
            education: 'Education',
            other: 'Other'
        };

        const accountEmojis = {
            checking: '🏦',
            savings: '💰',
            'credit-card': '💳',
            'debit-card': '💳',
            cash: '💵',
            paypal: '📱',
            venmo: '📱',
            zelle: '📱',
            'apple-pay': '📱',
            'google-pay': '📱',
            other: '📝'
        };

        const accountNames = {
            checking: 'Checking',
            savings: 'Savings',
            'credit-card': 'Credit Card',
            'debit-card': 'Debit Card',
            cash: 'Cash',
            paypal: 'PayPal',
            venmo: 'Venmo',
            zelle: 'Zelle',
            'apple-pay': 'Apple Pay',
            'google-pay': 'Google Pay',
            other: 'Other'
        };

        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="expense-item">
                <button class="delete-btn" onclick="expenseTracker.deleteExpense('${expense.id}')" title="Delete expense">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="expense-header">
                    <div class="expense-description">${this.escapeHtml(expense.description)}</div>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                </div>
                <div class="expense-details">
                    <div class="expense-tags">
                        <span class="expense-category">
                            ${categoryEmojis[expense.category]} ${categoryNames[expense.category]}
                        </span>
                        <span class="expense-account">
                            ${accountEmojis[expense.account]} ${accountNames[expense.account]}
                        </span>
                    </div>
                    <span class="expense-date">${formattedDate}</span>
                </div>
            </div>
        `;
    }

    // Update summary cards
    updateSummary() {
        const filteredExpenses = this.getFilteredExpenses();
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Calculate monthly expenses
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const monthlyExpenses = this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date + 'T00:00:00');
                return expenseDate.getFullYear() === currentYear && 
                       expenseDate.getMonth() === currentMonth;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);

        document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('monthlyExpenses').textContent = `$${monthlyExpenses.toFixed(2)}`;
        document.getElementById('expenseCount').textContent = filteredExpenses.length;
    }

    // Update account summary
    updateAccountSummary() {
        const accountSummary = document.getElementById('accountSummary');
        
        if (this.expenses.length === 0) {
            accountSummary.innerHTML = `
                <div class="empty-accounts">
                    <i class="fas fa-wallet"></i>
                    <p>No expenses yet</p>
                </div>
            `;
            return;
        }

        // Group expenses by account
        const accountGroups = {};
        this.expenses.forEach(expense => {
            if (!accountGroups[expense.account]) {
                accountGroups[expense.account] = {
                    total: 0,
                    count: 0
                };
            }
            accountGroups[expense.account].total += expense.amount;
            accountGroups[expense.account].count += 1;
        });

        const accountNames = {
            checking: '🏦 Checking',
            savings: '💰 Savings',
            'credit-card': '💳 Credit Card',
            'debit-card': '💳 Debit Card',
            cash: '💵 Cash',
            paypal: '📱 PayPal',
            venmo: '📱 Venmo',
            zelle: '📱 Zelle',
            'apple-pay': '📱 Apple Pay',
            'google-pay': '📱 Google Pay',
            other: '📝 Other'
        };

        // Sort accounts by total amount (descending)
        const sortedAccounts = Object.entries(accountGroups)
            .sort(([,a], [,b]) => b.total - a.total);

        accountSummary.innerHTML = sortedAccounts.map(([account, data]) => `
            <div class="account-card">
                <div class="account-card-name">${accountNames[account] || account}</div>
                <div class="account-card-amount">$${data.total.toFixed(2)}</div>
                <div class="account-card-count">${data.count} expense${data.count !== 1 ? 's' : ''}</div>
            </div>
        `).join('');
    }

    // Update total balance
    updateTotalBalance() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('totalBalance').textContent = `$${totalExpenses.toFixed(2)}`;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Save expenses to localStorage
    saveExpenses() {
        const allExpenses = this.loadAllExpenses();
        allExpenses[this.currentProfile] = this.expenses;
        localStorage.setItem('expenseTracker', JSON.stringify(allExpenses));
    }

    // Load expenses from localStorage
    loadExpenses() {
        const allExpenses = this.loadAllExpenses();
        return allExpenses[this.currentProfile] || [];
    }

    // Load all expenses from localStorage
    loadAllExpenses() {
        const saved = localStorage.getItem('expenseTracker');
        return saved ? JSON.parse(saved) : {};
    }

    // Export expenses as CSV
    exportExpenses() {
        if (this.expenses.length === 0) {
            this.showNotification('No expenses to export', 'error');
            return;
        }

        const profileName = this.profiles[this.currentProfile].name;
        const headers = ['Date', 'Description', 'Amount', 'Category', 'Account', 'Profile'];
        const csvContent = [
            headers.join(','),
            ...this.expenses.map(expense => [
                expense.date,
                `"${expense.description}"`,
                expense.amount,
                expense.category,
                expense.account || 'N/A',
                profileName
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${profileName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification(`Expenses exported successfully for ${profileName}!`, 'success');
    }

    // Clear all expenses
    clearAllExpenses() {
        if (this.expenses.length === 0) {
            this.showNotification('No expenses to clear', 'error');
            return;
        }

        // Create a more detailed confirmation dialog
        const expenseCount = this.expenses.length;
        const totalAmount = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const profileName = this.profiles[this.currentProfile].name;
        
        const confirmMessage = `Are you sure you want to delete ALL ${expenseCount} expenses from "${profileName}" profile ($${totalAmount.toFixed(2)})?\n\nThis action cannot be undone!`;
        
        if (confirm(confirmMessage)) {
            this.expenses = [];
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification(`All ${expenseCount} expenses cleared from ${profileName}!`, 'success');
        }
    }

    // Delete expenses by category
    deleteExpensesByCategory(category) {
        const categoryExpenses = this.expenses.filter(expense => expense.category === category);
        
        if (categoryExpenses.length === 0) {
            this.showNotification(`No expenses found in this category`, 'error');
            return;
        }

        const categoryNames = {
            food: 'Food & Dining',
            transportation: 'Transportation',
            shopping: 'Shopping',
            entertainment: 'Entertainment',
            bills: 'Bills & Utilities',
            healthcare: 'Healthcare',
            education: 'Education',
            other: 'Other'
        };

        const totalAmount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const confirmMessage = `Delete all ${categoryExpenses.length} expenses in "${categoryNames[category]}" ($${totalAmount.toFixed(2)})?\n\nThis action cannot be undone!`;
        
        if (confirm(confirmMessage)) {
            this.expenses = this.expenses.filter(expense => expense.category !== category);
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification(`Deleted ${categoryExpenses.length} expenses from ${categoryNames[category]}`, 'success');
        }
    }

    // Delete expenses older than specified months
    deleteOldExpenses(monthsOld) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
        
        const oldExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date + 'T00:00:00');
            return expenseDate < cutoffDate;
        });
        
        if (oldExpenses.length === 0) {
            this.showNotification(`No expenses older than ${monthsOld} months found`, 'error');
            return;
        }

        const totalAmount = oldExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const confirmMessage = `Delete ${oldExpenses.length} expenses older than ${monthsOld} months ($${totalAmount.toFixed(2)})?\n\nThis action cannot be undone!`;
        
        if (confirm(confirmMessage)) {
            this.expenses = this.expenses.filter(expense => {
                const expenseDate = new Date(expense.date + 'T00:00:00');
                return expenseDate >= cutoffDate;
            });
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification(`Deleted ${oldExpenses.length} old expenses`, 'success');
        }
    }
}

// Initialize the expense tracker when the page loads
let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('expenseForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear filters
    if (e.key === 'Escape') {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('accountFilter').value = '';
        document.getElementById('monthFilter').value = '';
        expenseTracker.updateDisplay();
    }
});
