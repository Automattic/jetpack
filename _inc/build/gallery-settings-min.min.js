/* Do not modify this file directly. It is compiled from other files. */
/**
 * Jetpack Gallery Settings
 */
!function(e){var t=wp.media;t.view.Settings.Gallery=t.view.Settings.Gallery.extend({render:function(){var a=this.$el;return t.view.Settings.prototype.render.apply(this,arguments),a.append(t.template("jetpack-gallery-settings")),t.gallery.defaults.type="default",this.update.apply(this,["type"]),a.find("select[name=type]").on("change",function(){var t=a.find("select[name=columns]").closest("label.setting");"default"===e(this).val()||"thumbnails"===e(this).val()?t.show():t.hide()}).change(),this}})}(jQuery);