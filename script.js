let globalData = {};
let currentTab = 'leq';
let chartMain = null;
let chartTrimestre = null;

const colors = {
    esc1: '#3b82f6', // blue
    esc2: '#8b5cf6', // purple
    esc3: '#ef4444', // red
    esc4: '#f59e0b', // amber
    hist: '#64748b', // slate
    glass: 'rgba(255,255,255,0.1)'
};

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            globalData = data;
            loadTabData('leq'); // Quirúrgica por defecto
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('kpi-marzo').innerText = "Error cargando datos";
        });

    // Tab Listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            
            const tabId = targetBtn.getAttribute('data-tab');
            currentTab = tabId;
            
            // Re-trigger animations
            document.querySelectorAll('.anim-fade-in').forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; // trigger reflow
                el.style.animation = null; 
            });

            loadTabData(tabId);
        });
    });
});

const formatNum = (num) => new Intl.NumberFormat('es-ES').format(Math.round(num));

function loadTabData(tabId) {
    const data = globalData[tabId];
    if (!data) return;

    // Actualizar KPIs
    document.getElementById('kpi-marzo').innerText = formatNum(data.actual_marzo);
    document.getElementById('kpi-esc1').innerText = formatNum(data.proy_junio_esc1);
    
    // Tiempo medio
    document.getElementById('tm-marzo').innerText = data.tm_marzo.toFixed(0) + " d";
    document.getElementById('tm-esc1').innerText = data.tm_esc1.toFixed(0) + " d";
    document.getElementById('tm-esc2').innerText = data.tm_esc2.toFixed(0) + " d";
    document.getElementById('tm-esc3').innerText = data.tm_esc3.toFixed(0) + " d";
    document.getElementById('tm-esc4').innerText = data.tm_esc4.toFixed(0) + " d";
    
    // Cambiar la etiqueta dinámicamente si estamos en "pruebas" (Espera Media) o en el resto (Tiempo Medio)
    const labelText = tabId === 'pruebas' ? 'E. Media Estimada' : 'T. Medio Estimado';
    document.querySelectorAll('.time-label').forEach(el => el.innerText = labelText);

    // Calculamos el incremento %
    const percSc2 = (((data.proy_junio_esc2 - data.proy_junio_esc1) / data.proy_junio_esc1) * 100).toFixed(1);
    const percSc3 = (((data.proy_junio_esc3 - data.proy_junio_esc1) / data.proy_junio_esc1) * 100).toFixed(1);
    const percSc4 = (((data.proy_junio_esc4 - data.proy_junio_esc1) / data.proy_junio_esc1) * 100).toFixed(1);

    document.getElementById('kpi-esc2').innerHTML = `${formatNum(data.proy_junio_esc2)} <span style="font-size:1rem; color:${colors.esc2}">+${percSc2}%</span>`;
    document.getElementById('kpi-esc3').innerHTML = `${formatNum(data.proy_junio_esc3)} <span style="font-size:1rem; color:${colors.esc3}">+${percSc3}%</span>`;
    document.getElementById('kpi-esc4').innerHTML = `${formatNum(data.proy_junio_esc4)} <span style="font-size:1rem; color:${colors.esc4}">${percSc4 > 0 ? '+' : ''}${percSc4}%</span>`;

    renderCharts(data);
}

function renderCharts(data) {
    if (chartMain) chartMain.destroy();
    if (chartTrimestre) chartTrimestre.destroy();

    const ctxMain = document.getElementById('mainChart').getContext('2d');
    const ctxTrim = document.getElementById('trimestreChart').getContext('2d');
    
    // Preparar dataset Main
    const allLabels = [...data.historico.labels, ...data.proyeccion.labels];
    const histData = [...data.historico.data, data.historico.data[data.historico.data.length - 1], null, null, null];
    const esc1Full = [null, null, data.historico.data[2], ...data.proyeccion.escenario1];
    const esc2Full = [null, null, data.historico.data[2], ...data.proyeccion.escenario2];
    const esc3Full = [null, null, data.historico.data[2], ...data.proyeccion.escenario3];
    const esc4Full = [null, null, data.historico.data[2], ...data.proyeccion.escenario4];

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // --- MAIN CHART ---
    chartMain = new Chart(ctxMain, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Histórico (Real)',
                    data: histData,
                    borderColor: colors.hist,
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointBackgroundColor: colors.hist,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Esc 1 (Act. Normal)',
                    data: esc1Full,
                    borderColor: colors.esc1,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 4,
                    pointBackgroundColor: colors.esc1,
                    pointRadius: 5,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Esc 2 (Sin Extr.)',
                    data: esc2Full,
                    borderColor: colors.esc2,
                    borderWidth: 3,
                    pointBackgroundColor: colors.esc2,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Esc 3 (Solo Ord.)',
                    data: esc3Full,
                    borderColor: colors.esc3,
                    borderWidth: 3,
                    pointBackgroundColor: colors.esc3,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Esc 4 (Puro 2026)',
                    data: esc4Full,
                    borderColor: colors.esc4,
                    borderWidth: 3,
                    borderDash: [10, 5],
                    pointBackgroundColor: colors.esc4,
                    pointRadius: 4,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' },
                legend: { position: 'top', align: 'end' }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: data.historico.data[0] * 0.8 },
                x: { grid: { color: 'transparent' } }
            }
        }
    });

    // --- TRIMESTRE CHART (con extaprolación a Junio) ---
    // Unimos los datos históricos reales con los previstos según la tendencia puramente de 2026 (Escenario 4)
    const combinedLabels = [...data.historico.labels, ...data.proyeccion.labels];
    const combinedData = [...data.historico.data, ...data.proyeccion.escenario4];
    
    // Para destacar visualmente qué es real (cerrado) y qué es previsto (proyección)
    const bgColors = [
        'rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', // Reales
        'rgba(245, 158, 11, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(245, 158, 11, 0.6)'  // Proyectadas (Amber/Naranja claro para alertar tendencia)
    ];
    
    const borders = [
        '#8b5cf6', '#8b5cf6', '#8b5cf6',
        '#f59e0b', '#f59e0b', '#f59e0b'
    ];

    chartTrimestre = new Chart(ctxTrim, {
        type: 'bar',
        data: {
            labels: combinedLabels,
            datasets: [{
                label: 'Volumen Estructural en Espera',
                data: combinedData,
                backgroundColor: bgColors,
                borderColor: borders,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: data.historico.data[0] * 0.95 },
                x: { grid: { display: false } }
            }
        }
    });
}
