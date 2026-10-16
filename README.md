# MANDALA — El experimento

Un juego web audiovisual sobre obedecer, explorar y perder el control. Versión 0.3 para ensayos de la instalación M.A.N.D.A.1.4, con dirección visual cinematográfica de fantasía y controles de PC.

## Abrir

Con Node.js 22 o posterior instalado, hacer doble clic en `ABRIR-MANDALA.cmd`, o abrir una terminal en esta carpeta y ejecutar:

```
npm start
```

Entrar en http://127.0.0.1:4173. No requiere instalar paquetes. Para el sonido, usar auriculares o parlantes y tocar **Entrar al experimento**. El navegador necesita ese gesto para habilitar el audio. También funciona desde un servidor estático con `dist/` como raíz.

## Jugar

La sesión dura 2:30 minutos. El primer objetivo es vincular tres nodos luminosos: se pueden tocar con el mouse o activar con 1, 2 y 3. WASD acerca y desplaza la cámara; el mouse añade un movimiento suave. Espacio pausa y F abre pantalla completa. Hay botones equivalentes para las acciones principales en pantallas táctiles. I estabiliza; O cambia la velocidad; P cambia el color del halo. X intensifica la señal, Z desvía el color y C acelera el ambiente. Estos controles adicionales siguen disponibles para ensayos.

Las acciones modifican la imagen, la síntesis sonora y el registro final. El relato avanza aunque el participante obedezca o no toque nada. Experimentar no permite saltar etapas. En Decisión se puede intentar restaurar el protocolo o explorar. En Ruptura los controles del participante dejan de ser eficaces. Final funde toda la salida a negro y silencia el audio.

Con **Entidad onírica**, E cierra o abre los ojos; V hace hablar a la entidad; B dispara una expansión del halo. La cara parpadea y sus labios se separan al hablar. Las expresiones se mezclan desde un atlas de cuatro imágenes alineadas; la geometría del rostro no se estira, ondula ni deforma. Doce nodos de color, ondas y partículas con profundidad se mueven por separado alrededor del personaje.

## Estudio y proyección

La vista **Estudio** permite seleccionar Entidad onírica o Mandala floral, ajustar alteración, velocidad, color y luminosidad, controlar las seis fases y seleccionar un recorrido automático o manual. La duración se elige antes de iniciar o después de Reiniciar: ensayo de 1 minuto, sesión de 2:30 o función de 5 minutos.

**Proyectar** abre una segunda ventana sincronizada en la misma computadora y navegador. Moverla al proyector y hacer doble clic para pantalla completa. Si se bloquea la ventana, habilitar ventanas emergentes para este sitio. El audio sale exclusivamente de la ventana principal. Si se pierde la conexión, la proyección se apaga y muestra un aviso. Las teclas del participante también funcionan con foco en la ventana de proyección.

En Estudio, Expansión regula el halo; Nodos de color regula la red orbital; Ondas de trance regula sus anillos. La voz femenina argentina Elena está incluida como once clips MP3, por lo que las frases de la obra no dependen de las voces instaladas. La boca responde a la energía del audio mediante un analizador Web Audio. Las expresiones son aproximadas, sin visemas de fonemas ni seguimiento facial. Se puede desactivar la voz independientemente del ambiente o elegir una voz del navegador como alternativa.

**Negro** apaga la salida visual y silencia el audio sin detener el reloj narrativo. **Pausar** detiene el reloj y el sonido; **Reiniciar** limpia los contadores y la sesión. No usar dos ventanas de control para la misma función: cada una crea una sesión independiente.

Se pueden cargar audio, imágenes y videos locales. La pista se reproduce en bucle; el video de fondo es mudo. La mezcla de imagen se compone mediante luz sobre la visual. Los archivos permanecen en memoria durante la sesión: no se suben ni guardan. Al recargar hay que volver a cargarlos. Códecs y formatos dependen del navegador.

## Dirección audiovisual

- **Protocolo**: simetría, respiración lenta y un acorde estable.
- **Anomalía**: pequeñas desviaciones en la forma y desafinaciones.
- **Advertencia**: la figura conserva las intervenciones; el mensaje culpa al participante.
- **Decisión**: restaurar o explorar sin borrar la memoria acumulada.
- **Ruptura**: pérdida de control, una red de luz más intensa y mayor inestabilidad armónica; el rostro conserva su forma.
- **Final**: diez segundos de disolución a negro y silencio en la sesión estándar.

El mandala floral se dibuja con pétalos Bézier y filigranas en Canvas; WebGL anima su rotación. La entidad usa un atlas de expresiones original generado para este proyecto, con mezcla de párpados y labios y movimientos rígidos suaves de cámara. La presentación busca una estética de cinemática de un juego de fantasía. La implementación es WebGL 2.5D; no contiene Unreal Engine ni un personaje con malla facial 3D. La geometría del halo y sus nodos se generan en el shader. Si WebGL no está disponible se usa Canvas 2D con una expresión fija y movimiento más simple. Se reduce la velocidad de animación cuando el navegador indica preferencia de movimiento reducido.

No es una IA que observe al público: el relato y las respuestas son reglas locales. No usa cámara ni micrófono. El juego y las frases incluidas se ejecutan desde los archivos del sitio; la alternativa de voces del navegador depende de ese proveedor. No usa p5.js.

## Validación

`npm test` comprueba la progresión sin intervención, el avance pese a la obediencia, el orden de las fases, estabilización, pausa, modo manual, ruptura y fundido final, además de ojos, habla, expansión y el bloqueo de expresiones en ruptura.

Antes de una función real, ensayar con el proyector y la salida de audio elegidos. El navegador puede limitar la frecuencia de actualización de ventanas en segundo plano; para una puesta real conviene dejar ambas ventanas visibles.

## Arte de la entidad

Generado con la herramienta integrada de imágenes. Prompt creativo: «Entidad femenina adulta onírica, rostro frontal y ojos dorados; filigranas turquesa y circuitos orgánicos; corona de pétalos y geometría simétrica violeta, azul, verde y ámbar; fondo cósmico negro; estética visionaria psicodélica, sin texto, marcas ni textura de rompecabezas».

La imagen de referencia fue una guía de dirección artística; la ilustración incorporada es una generación original. Los prompts se conservan en `ART-PROMPT.txt` y `CINEMATIC-PROMPT.txt`. La ilustración anterior permanece como referencia del desarrollo.

La voz incluida fue sintetizada con Microsoft Elena (`es-AR-ElenaNeural`) a partir de las frases ficticias de la obra, usando edge-tts. Referencias: https://learn.microsoft.com/azure/cognitive-services/speech-service/language-support y https://github.com/rany2/edge-tts . La biblioteca de síntesis no se incluye ni es necesaria para jugar; se distribuyen los MP3 resultantes.
