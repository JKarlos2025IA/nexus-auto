// Admin Panel Logic with Firebase
console.log("Nexus Auto Admin v3.0 Loaded - Firebase Auth Enabled");

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBF5F5pP1gjEL5Zr5xz40YXwqdghRHe-GI",
    authDomain: "nexus-auto-admin-v1.firebaseapp.com",
    projectId: "nexus-auto-admin-v1",
    storageBucket: "nexus-auto-admin-v1.firebasestorage.app",
    messagingSenderId: "576411907390",
    appId: "1:576411907390:web:6f56bc2996996486fae86f"
};

// Wait for modules to be loaded
document.addEventListener('DOMContentLoaded', async () => {
    while (!window.firebaseModules) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const { initializeApp, getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } = window.firebaseModules;

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const salesCollection = collection(db, 'ventas');

    // DOM Elements
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const salesForm = document.getElementById('sales-form');
    const salesTableBody = document.querySelector('#sales-table tbody');
    const noDataMessage = document.getElementById('no-data-message');
    const totalSalesCount = document.getElementById('total-sales-count');
    const totalRevenue = document.getElementById('total-revenue');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.dashboard-section');
    const dateInput = document.getElementById('fecha');

    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // --- Authentication ---
    function checkAuth() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User logged in:", user.email);
                showDashboard();
            } else {
                console.log("No user logged in");
                showLogin();
            }
        });
    }

    function showLogin() {
        loginView.style.display = 'flex';
        dashboardView.style.display = 'none';
    }

    function showDashboard() {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        subscribeToSales();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const errorMsg = document.getElementById('login-error');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            errorMsg.style.display = 'none';
            loginForm.reset();
            // showDashboard() will be called by onAuthStateChanged
        } catch (error) {
            console.error("Login error:", error);
            let message = "Error al iniciar sesión";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = "Correo o contraseña incorrectos";
            } else if (error.code === 'auth/too-many-requests') {
                message = "Demasiados intentos. Intenta más tarde";
            } else if (error.code === 'auth/invalid-email') {
                message = "Correo electrónico inválido";
            }
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
    });

    // Forgot password handler
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;

            if (!email) {
                alert("Por favor ingresa tu correo electrónico primero");
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                alert("Se ha enviado un enlace de recuperación a tu correo");
            } catch (error) {
                console.error("Password reset error:", error);
                if (error.code === 'auth/user-not-found') {
                    alert("No existe una cuenta con ese correo");
                } else {
                    alert("Error al enviar el correo de recuperación");
                }
            }
        });
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // showLogin() will be called by onAuthStateChanged
        } catch (error) {
            console.error("Logout error:", error);
            alert("Error al cerrar sesión");
        }
    });

    // --- Navigation ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Sales Logic ---
    let currentSales = [];
    let allSales = [];

    salesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = salesForm.querySelector('button[type="submit"]');
        const originalText = "REGISTRAR VENTA";

        if (btn.disabled) return;

        console.log("🔵 Iniciando guardado...");
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        // Safety timeout
        const safetyTimeout = setTimeout(() => {
            console.log("⚠️ Timeout - reseteando botón");
            btn.textContent = originalText;
            btn.disabled = false;
            alert("La operación tardó demasiado. El registro se guardó pero intenta recargar la página.");
        }, 10000);

        try {
            const newSale = {
                fecha: document.getElementById('fecha').value,
                placa: document.getElementById('placa').value.toUpperCase(),
                tipo: document.getElementById('tipo').value,
                color: document.getElementById('color').value,
                servicio: document.getElementById('servicio').value,
                precio: parseFloat(document.getElementById('precio').value),
                pago: document.getElementById('pago').value,
                timestamp: new Date().toISOString()
            };

            console.log("🔵 Enviando a Firebase...", newSale);
            const docRef = await addDoc(salesCollection, newSale);
            console.log("✅ Guardado exitoso! ID:", docRef.id);

            clearTimeout(safetyTimeout);

            salesForm.reset();
            const dateInput = document.getElementById('fecha');
            if (dateInput) dateInput.valueAsDate = new Date();

            btn.textContent = '¡GUARDADO!';
            btn.style.backgroundColor = '#28a745';
            btn.style.color = 'white';
            btn.style.borderColor = '#28a745';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.disabled = false;
                console.log("🔵 Botón reseteado");
            }, 1500);

        } catch (error) {
            clearTimeout(safetyTimeout);
            console.error("❌ Error:", error);
            alert("Error al guardar: " + error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    function subscribeToSales() {
        console.log("📡 Iniciando suscripción a ventas...");
        const q = query(salesCollection, orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => {
            console.log("📥 Datos recibidos de Firebase. Total documentos:", snapshot.size);
            const sales = [];
            snapshot.forEach((doc) => {
                const saleData = { id: doc.id, ...doc.data() };
                console.log("📄 Documento:", saleData);
                sales.push(saleData);
            });
            allSales = sales;
            console.log("✅ Total ventas cargadas:", allSales.length);
            applyFilters();
        }, (error) => {
            console.error("❌ Error al obtener documentos:", error);
            console.error("Código de error:", error.code);
            console.error("Mensaje:", error.message);
            alert("Error al cargar datos: " + error.message);
        });
    }

    // --- Filtering ---
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    const btnClearFilters = document.getElementById('btn-clear-filters');

    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', applyFilters);
    }

    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', clearFilters);
    }

    function applyFilters() {
        const dateStart = document.getElementById('filter-date-start').value;
        const dateEnd = document.getElementById('filter-date-end').value;
        const placa = document.getElementById('filter-placa').value.toUpperCase();
        const tipo = document.getElementById('filter-tipo').value;
        const pago = document.getElementById('filter-pago').value;

        currentSales = allSales.filter(sale => {
            let match = true;
            if (dateStart && sale.fecha < dateStart) match = false;
            if (dateEnd && sale.fecha > dateEnd) match = false;
            if (placa && !sale.placa.includes(placa)) match = false;
            if (tipo && sale.tipo !== tipo) match = false;
            if (pago && sale.pago !== pago) match = false;
            return match;
        });

        renderTable(currentSales);
        updateStats(currentSales);
    }

    function clearFilters() {
        document.getElementById('filter-date-start').value = '';
        document.getElementById('filter-date-end').value = '';
        document.getElementById('filter-placa').value = '';
        document.getElementById('filter-tipo').value = '';
        document.getElementById('filter-pago').value = '';
        applyFilters();
    }

    function renderTable(sales) {
        salesTableBody.innerHTML = '';

        if (sales.length === 0) {
            noDataMessage.style.display = 'block';
            return;
        } else {
            noDataMessage.style.display = 'none';
        }

        sales.forEach(sale => {
            const row = document.createElement('tr');
            const priceFormatted = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(sale.precio);

            row.innerHTML = `
                <td>${sale.fecha}</td>
                <td style="font-weight: bold;">${sale.placa}</td>
                <td style="text-transform: capitalize;">${sale.tipo}</td>
                <td style="text-transform: capitalize;">${sale.color}</td>
                <td style="text-transform: capitalize;">${sale.servicio}</td>
                <td><span class="status-badge status-${sale.pago}">${sale.pago}</span></td>
                <td>${priceFormatted}</td>
                <td>
                    <button class="btn-delete" data-id="${sale.id}" style="background:none; border:none; color: #ff4444; cursor:pointer;">
                        <i class="ph ph-trash" style="font-size: 1.2rem;"></i>
                    </button>
                </td>
            `;
            salesTableBody.appendChild(row);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('¿Estás seguro de eliminar este registro de la nube?')) {
                    const id = e.currentTarget.getAttribute('data-id');
                    try {
                        await deleteDoc(doc(db, "ventas", id));
                    } catch (error) {
                        console.error("Error deleting doc: ", error);
                        alert("Error al eliminar");
                    }
                }
            });
        });
    }

    function updateStats(sales) {
        totalSalesCount.textContent = sales.length;
        const total = sales.reduce((sum, sale) => sum + (sale.precio || 0), 0);
        totalRevenue.textContent = total.toFixed(2);
    }

    // --- Export Functions ---
    window.exportToCSV = function () {
        if (currentSales.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha,Placa,Tipo,Color,Servicio,Precio,Pago\n";

        currentSales.forEach(sale => {
            const row = [
                sale.fecha,
                sale.placa,
                sale.tipo,
                sale.color,
                sale.servicio,
                sale.precio,
                sale.pago
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ventas_nexus_auto_cloud.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    window.copyForWhatsApp = function () {
        const today = new Date().toISOString().split('T')[0];
        const todaysSales = currentSales.filter(s => s.fecha === today);

        if (todaysSales.length === 0) {
            alert("No hay ventas registradas con fecha de hoy.");
            return;
        }

        let message = `*REPORTE NEXUS AUTO (${today})*\n\n`;
        let total = 0;

        todaysSales.forEach(sale => {
            message += `🚗 *${sale.placa}* - ${sale.servicio}\n`;
            message += `   💰 S/ ${sale.precio} (${sale.pago})\n`;
            message += `------------------\n`;
            total += sale.precio;
        });

        message += `\n*TOTAL DÍA: S/ ${total.toFixed(2)}*`;

        navigator.clipboard.writeText(message).then(() => {
            alert("Reporte copiado al portapapeles.");
        }).catch(err => {
            console.error('Error al copiar: ', err);
            alert("Error al copiar al portapapeles.");
        });
    }

    checkAuth();
});
