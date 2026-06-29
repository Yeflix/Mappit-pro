# RescateUnidos — Panel de moderación (Web)

Stack: Vite + React 18 + Tailwind + Firebase (Auth + Firestore).
Alineado con la app Flutter (`lib/`): mismas colecciones, mismos valores de enum.

## Instalar y correr
```bash
npm install
npm run dev          # http://localhost:3000
```

## Credenciales Firebase
Las claves del proyecto `mappit-app1` ya están en `src/services/firebase.js`.
Crea al menos un usuario en **Firebase Authentication → Email/Password**
para iniciar sesión en `/login`.

## Build de producción
```bash
npm run build        # genera /dist
npm run preview
```

## Rutas
- `/login` — acceso
- `/` — Dashboard
- `/puntos` — Puntos de ayuda aprobados (estado operativo + verificación)
- `/solicitudes` — Moderación de registros ciudadanos (aprobar / rechazar)
- `/reportes` — Reportes urgentes (badge en sidebar)
- `/alertas` — Alertas oficiales (feed de Novedades)
- `/zonas` — Zonas de impacto (severidad sísmica)
- `/contadores` — Contadores por zona

## Colecciones de Firestore (idénticas a la app Flutter)
| Colección            | Uso |
|----------------------|-----|
| `puntos_ayuda`       | Puntos aprobados/publicados. Escritura solo desde el panel. |
| `solicitudes_punto`  | Registros enviados por la comunidad, pendientes de moderación. |
| `reportes_urgentes`  | Emergencias (datos de contacto solo visibles aquí). |
| `alertas_oficiales`  | Feed de Novedades. Las de nivel `critica` disparan push. |
| `contadores_zona`    | Agregados por estado (mantenidos por Cloud Function). |
| `confirmaciones`     | Confirmaciones de la comunidad sobre un punto. |
| `zonas_impacto`      | Severidad sísmica por zona (mapa). |

### Flujo de moderación
Al **aprobar** una solicitud en `/solicitudes`:
1. El documento se copia a `puntos_ayuda` con `estadoModeracion: 'aprobado'`.
2. Se genera automáticamente una alerta en `alertas_oficiales`
   (`nuevo_punto_ayuda` o `nuevo_donante_servicio` para `servicio_voluntario`),
   tal como espera la app Flutter.
3. La solicitud original se elimina de `solicitudes_punto`.

Al **rechazar**, la solicitud queda con `estadoModeracion: 'rechazado'` y un
`motivoRechazo` opcional.

## Valores de enum
Centralizados en `src/constants/rescate.js`, espejo exacto de
`lib/models/*.dart`. No cambiar los `valor` sin actualizar también Flutter.

## Cambios de esta versión (alineación con Flutter)
- Colecciones corregidas: `puntos_de_ayuda` → `puntos_ayuda`,
  `confirmaciones_comunidad` → `confirmaciones`; añadidas `solicitudes_punto`
  y `zonas_impacto`.
- Puntos: estado operativo (`operativo/saturado/cerrado/necesita_donaciones`),
  verificación por enum (`oficial/voluntario_verificado/comunidad`) en lugar de
  un booleano, urgencia, necesidades, capacidad/ocupada, instagram/redSocial,
  referencia, `esMovil`, `ultimaActualizacion`, y panel de confirmaciones.
- Nueva pantalla **Solicitudes** (moderación) con aprobación que publica el
  punto y crea la alerta automática.
- Nueva pantalla **Zonas de impacto** (CRUD de severidad sísmica).
- Alertas reescritas al `TipoAlerta` real + `nivel`, `zonasAfectadas` (múltiple),
  `fuente`, `verificado`, `enlaceExterno`, `expiraEn`.
- Contadores con todos los campos del modelo `ContadorZona`.
- Eliminadas páginas obsoletas del proyecto viejo (Negocios, Noticias, etc.).
