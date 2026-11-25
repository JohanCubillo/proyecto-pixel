# Proyecto Pixel — mapa

Mapa 3D de Costa Rica: cada persona que comenta tiene su casita en el distrito que escribió, y arriba del Caribe flota el Pueblo Pixel.

- Buscá tu casa por tu @ (o abrí `?u=tu_usuario` para ir directo a ella).
- **Recorrido de La Tucaneta**: el bus va dejando a los nuevos del último día.
- **Guerra de provincias**: la provincia con más casas lleva la corona.
- `?prueba=30000` llena el mapa con casas de prueba para medir el rendimiento.

## Agregar casas

Todo vive en `data/`. Para los comentarios de un día nuevo:

1. Agregá una línea por persona en `data/casas.json`:

   ```json
   {"u": "usuario", "net": "ig", "prov": "Limón", "canton": "Pococí", "dist": "Guápiles", "lat": 10.2152, "lon": -83.7863, "day": 14}
   ```

   - `net`: `"ig"` (techo rojo) o `"tt"` (techo azul).
   - `lat` / `lon`: el centro del **distrito**, nunca una dirección exacta.
   - `day`: el día del video en que llegó; el recorrido muestra los del día más alto.
   - Opcional `"vecino": "otro_usuario"`: la casa queda pegada a la de esa persona, con un corazón.
   - Opcional `"color": "#ffaa00"`: color del techo.
2. Actualizá `data/estado.json` con el día y los seguidores.
3. Subí los cambios; GitHub Pages publica solo en un minuto.

Quien pida quitar su casa: borrá su línea de `data/casas.json`.

## Probar en la compu

`fetch` no funciona abriendo el archivo directo, hay que usar un servidor:

```
python3 -m http.server 8000
```

y abrir http://localhost:8000

Hecho con three.js. Límites de provincias y cantones: [maufonsecasdfg/costa-rica-geojson](https://github.com/maufonsecasdfg/costa-rica-geojson).
