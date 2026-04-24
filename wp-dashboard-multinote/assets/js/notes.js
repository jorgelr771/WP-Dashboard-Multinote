jQuery(document).ready(function($) {
    // Contenedor principal de notas (cacheamos para no buscarlo repetidamente)
    const $container = $('#wpcdw-notes-container');

    // Guardar con Ctrl + S (o Cmd + S en Mac)
    $(document).on('keydown', function(e) {
        // Ctrl + S  o  Cmd + S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();

            // Buscamos el elemento con foco dentro del contenedor de notas
            const $focused = $(document.activeElement);

            // Solo actuamos si el foco está en un input o textarea de una nota
            if ($focused.length && 
                ($focused.is('.wpcdw-note-title') || $focused.is('.wpcdw-note-content'))) {

                // Encontramos el botón Guardar de esa misma nota
                const $saveButton = $focused.closest('.wpcdw-note').find('.wpcdw-save-note');

                if ($saveButton.length) {
                    $saveButton.trigger('click');
                }
            }
        }
    });
    
    // 1. Crear nueva nota – con protección anti-doble clic
    let isAddingNote = false;

    $('#wpcdw-add-note').on('click', function(e) {

        if (isAddingNote) return; // ya hay una petición en curso

        isAddingNote = true;
        const $button = $(this);
        const originalText = $button.text();

        $button.text('Creando...').prop('disabled', true);

        $.post(wpcdw_ajax.url, {
            action: 'wpcdw_add_note',
            _ajax_nonce: wpcdw_ajax.nonce
        })
            .done(function(response) {
            if (response.success && response.data) {
                const note = response.data;

                const noteHtml = `
                <div class="wpcdw-note" data-id="${note.id}">
                    <input type="text" class="wpcdw-note-title" value="${note.title}" placeholder="Título de la nota..." />
                    <textarea class="wpcdw-note-content">${note.content}</textarea>
                    <div class="wpcdw-note-actions">
                        <button class="button wpcdw-save-note">Guardar</button>
                        <button class="button wpcdw-delete-note">Borrar</button>
                    </div>
                </div>
            `;

                $container.prepend(noteHtml);

                $('#wpcdw-message')
                    .text('¡Nota creada! Escribe algo y guarda.')
                    .css('color', 'green')
                    .fadeIn().delay(3000).fadeOut();
            } else {
                $('#wpcdw-message')
                    .text(response.data || 'Error al crear nota')
                    .css('color', 'red');
            }
        })
            .fail(function() {
            $('#wpcdw-message')
                .text('Error de conexión al crear 😕')
                .css('color', 'red');
        })
            .always(function() {
            $button.text(originalText).prop('disabled', false);
            isAddingNote = false;
        });
    });

    // 2. Guardar nota (delegación de eventos)
    $container.on('click', '.wpcdw-save-note', function(e) {

        const $note      = $(this).closest('.wpcdw-note');
        const noteId     = $note.data('id');
        const title      = $note.find('.wpcdw-note-title').val();
        const content    = $note.find('.wpcdw-note-content').val();

        const $button      = $(this);
        const originalText = $button.text();

        // Feedback visual
        $button.text('Guardando...').prop('disabled', true);

        $.post(wpcdw_ajax.url, {
            action: 'wpcdw_update_note',
            note_id: noteId,
            title: title,
            content: content,
            _ajax_nonce: wpcdw_ajax.nonce
        })
            .done(function(response) {
            if (response.success) {
                $('#wpcdw-message')
                    .text(response.data)
                    .css('color', 'green')
                    .fadeIn().delay(2500).fadeOut();

                // Éxito visual en botón
                $button.text('Guardado ✓').css('background', '#46b450');
                setTimeout(() => {
                    $button.text(originalText).css('background', '').prop('disabled', false);
                }, 2000);
            } else {
                $('#wpcdw-message')
                    .text(response.data || 'Error al guardar')
                    .css('color', 'red');
                $button.text(originalText).prop('disabled', false);
            }
        })
            .fail(function() {
            $('#wpcdw-message')
                .text('Error de conexión al guardar 😕')
                .css('color', 'red');
            $button.text(originalText).prop('disabled', false);
        });
    });

    // 3. Borrar nota (delegación de eventos)
    $container.on('click', '.wpcdw-delete-note', function(e) {

        const $note   = $(this).closest('.wpcdw-note');
        const noteId  = $note.data('id');

        if (!confirm('¿Seguro que quieres borrar esta nota? No se puede recuperar.')) {
            return;
        }

        const $button      = $(this);
        const originalText = $button.text();

        $button.text('Borrando...').prop('disabled', true);

        $.post(wpcdw_ajax.url, {
            action: 'wpcdw_delete_note',
            note_id: noteId,
            _ajax_nonce: wpcdw_ajax.nonce
        })
            .done(function(response) {
            if (response.success) {
                $note.fadeOut(400, function() {
                    $(this).remove();
                });

                $('#wpcdw-message')
                    .text('Nota eliminada correctamente')
                    .css('color', 'green')
                    .fadeIn().delay(2500).fadeOut();
            } else {
                $('#wpcdw-message')
                    .text(response.data || 'No se pudo borrar la nota')
                    .css('color', 'red');
                $button.text(originalText).prop('disabled', false);
            }
        })
            .fail(function() {
            $('#wpcdw-message')
                .text('Error de conexión al borrar 😕')
                .css('color', 'red');
            $button.text(originalText).prop('disabled', false);
        });
    });
    
    // Guardado automático
    let autoSaveTimers = {}; // un temporizador por nota

    function scheduleAutoSave($note) {
        const noteId = $note.data('id');

        // Limpiar temporizador anterior si existe
        if (autoSaveTimers[noteId]) {
            clearTimeout(autoSaveTimers[noteId]);
        }

        // Programar guardado en 5 segundos
        autoSaveTimers[noteId] = setTimeout(() => {
            const $saveBtn = $note.find('.wpcdw-save-note');
            if ($saveBtn.length) {
                $saveBtn.trigger('click');
            }
            delete autoSaveTimers[noteId];
        }, 5000);
    }

    // Cada vez que se escribe en título o contenido → reprogramar guardado
    $container.on('input', '.wpcdw-note-title, .wpcdw-note-content', function() {
        const $note = $(this).closest('.wpcdw-note');
        scheduleAutoSave($note);
    });

    // Guardado al salir del campo (blur) → inmediato
    $container.on('blur', '.wpcdw-note-title, .wpcdw-note-content', function() {
        const $note = $(this).closest('.wpcdw-note');
        const $saveBtn = $note.find('.wpcdw-save-note');

        if ($saveBtn.length) {
            $saveBtn.trigger('click');
        }

        // Limpiar temporizador si ya se guardó por blur
        const noteId = $note.data('id');
        if (autoSaveTimers[noteId]) {
            clearTimeout(autoSaveTimers[noteId]);
            delete autoSaveTimers[noteId];
        }
    });
    
    // 4. Exportar todas las notas
    $('#wpcdw-export-notes').on('click', function(e) {
        const $button = $(this);
        const originalText = $button.text();

        $button.text('Exportando...').prop('disabled', true);

        $.post(wpcdw_ajax.url, {
            action: 'wpcdw_export_notes',
            _ajax_nonce: wpcdw_ajax.nonce
        })
        .done(function(response) {
            if (response.success && response.data) {
                const dataStr = JSON.stringify(response.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'mis-notas-dashboard-' + new Date().toISOString().split('T')[0] + '.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                $('#wpcdw-message')
                    .text('¡Notas exportadas correctamente!')
                    .css('color', 'green')
                    .fadeIn().delay(3000).fadeOut();
            } else {
                $('#wpcdw-message')
                    .text(response.data || 'No se pudieron exportar las notas')
                    .css('color', 'red');
            }
        })
        .fail(function() {
            $('#wpcdw-message')
                .text('Error de conexión al exportar 😕')
                .css('color', 'red');
        })
        .always(function() {
            $button.text(originalText).prop('disabled', false);
        });
    });  
});
