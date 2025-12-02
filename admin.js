// Admin Panel Logic with Firebase

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBF5F5pP1gjEL5Zr5xz40YXwqdghRHe-GI",
    authDomain: "nexus-auto-admin-v1.firebaseapp.com",
    projectId: "nexus-auto-admin-v1",
    storageBucket: "nexus-auto-admin-v1.firebasestorage.app",
    messagingSenderId: "576411907390",
    appId: "1:576411907390:web:a57ddffac5c599d4fae86f"
};

// Wait for modules to be loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for the module script in HTML to run and populate window.firebaseModules
    // In a real build system this would be imported directly, but here we are bridging.
    while (!window.firebaseModules) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const { initializeApp, getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } = window.firebaseModules;

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
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

    // Set default date to today
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // --- Authentication (Simple Local for now, Data in Cloud) ---

    function checkAuth() {
        const isAuth = localStorage.getItem('nexus_admin_auth') === 'true';
        if (isAuth) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginView.style.display = 'flex';
        dashboardView.style.display = 'none';
    }

    function showDashboard() {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        subscribeToSales(); // Real-time listener
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;

        // Hardcoded password for demonstration
        if (password === 'admin123' || password === 'nexus2025') {
            localStorage.setItem('nexus_admin_auth', 'true');
            loginError.style.display = 'none';
            showDashboard();
            loginForm.reset();
        } else {
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('nexus_admin_auth');
        showLogin();
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

    // --- Sales Logic (Firestore) ---

    let currentSales = []; // Store for export

    salesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = salesForm.querySelector('button[type="submit"]');
        const originalText = "REGISTRAR VENTA";
        const originalColor = btn.style.backgroundColor;

        btn.textContent = 'Guardando...';
        btn.disabled = true;

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

            await addDoc(salesCollection, newSale);

            // Success Actions
            salesForm.reset();
            document.getElementById('fecha').valueAsDate = new Date();

            // Visual Feedback
            btn.textContent = '¡GUARDADO!';
            btn.style.backgroundColor = '#28a745'; // Green color

            // Reset button after 2 seconds
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = originalColor;
                btn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error al guardar: " + error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    function subscribeToSales() {
        const q = query(salesCollection, orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            const sales = [];
            snapshot.forEach((doc) => {
                sales.push({ id: doc.id, ...doc.data() });
            });
            currentSales = sales;
            renderTable(sales);
            updateStats(sales);
        }, (error) => {
            console.error("Error getting documents: ", error);
        });
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

    // Initialize
    checkAuth();
});
