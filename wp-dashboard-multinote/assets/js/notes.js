jQuery(document).ready(function($) {
  // Contenedor principal de notas (cacheamos para no buscarlo repetidamente)
  const $container = $('#wpcdw-notes-container');

  // 1. Crear nueva nota
  $('#wpcdw-add-note').on('click', function(e) {
    e.preventDefault();

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

          // Añadimos al principio (más reciente arriba)
          $container.prepend(noteHtml);

          $('#wpcdw-message')
            .text('¡Nota creada! Escribe algo y guarda.')
            .css('color', 'green')
            .fadeIn().delay(3000).fadeOut();
        }
      })
      .fail(function() {
        $('#wpcdw-message')
          .text('Error al crear la nota 😕')
          .css('color', 'red');
      });
  });

  // 2. Guardar nota (delegación de eventos)
  $container.on('click', '.wpcdw-save-note', function(e) {
    e.preventDefault();

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
    e.preventDefault();

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
});