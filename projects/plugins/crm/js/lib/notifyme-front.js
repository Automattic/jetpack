jQuery(function($){

	//get the notifications every 10 seconds (will increase this in test....)
	window.notification_fired = false;
	window.notifications = 0;

	//on load...
  	notifyme_get_notifications();

  	//then every 5 minutes..  [can amend if you think too short / long]
	window.setInterval(function(){
	  notifyme_get_notifications();
	}, 300000);  



});




function notifyme_fire_notification(notify_title,notify_body){
	//in case we want to allow users to turn off the browser push..
	if(window.notifyme.notification_settings.browser_push == 0){
		return false;
	}
	var  notifymenow = Date.now();   //U in seconds
	var  notifymenotifications = window.notifications;
	var notifymecookienow = Cookies.get('notify_stamp');
	var notifymecountnow = Cookies.get('notify_count');
	if(Cookies.get('notify_flag') === 'notify_set'){
		//this checks how long ago it browser notified, and doesn't do it again.. (5 mins = 300)
		timediff = (notifymenow - notifymecookienow)/1000;
		if(timediff > 300 && window.notifyme.notification_settings.browser_push == 1){
			Push.create(notify_title, {
			    body: notify_body,
			    icon: notifyme.ph_notify_logo,
			    timeout: 4000,
			    onClick: function () {
			        window.focus();
			        this.close();
			    }
			});	
		Cookies.set('notify_stamp', notifymenow);
		Cookies.set('notify_count', notifymenotifications);
		Cookies.set('notify_flag', 'notify_set');
		}
	}else{
		if(window.notifyme.notification_settings.browser_push == 1){
			Push.create(notify_title, {
			    body: notify_body,
			    icon: notifyme.ph_notify_logo,
			    timeout: 4000,
			    onClick: function () {
			        window.focus();
			        this.close();
			    }
			});
		Cookies.set('notify_stamp', notifymenow);
		Cookies.set('notify_count', notifymenotifications);
		Cookies.set('notify_flag', 'notify_set');
		}
	}

}

//this returns us back to a bell - not used
function notifyme_return_to_bell(){
	jQuery('#notifymebell').html("<i class='fa fa-bell'></i>");
}


function notifyme_get_notifications(){
	if (typeof notifyme != "undefined" && notifyme.current_user > 0){
		var t = {
			action: 'notifyme_get_notifications_ajax',
			security: notifyme.notification_nonce,
			current: notifyme.current_user
		};
        i = jQuery.ajax({
            url: ajaxurl,
            type: "POST",
            data: t,
            dataType: "json"
        });
        i.done(function(response) {
        	if(response){
				if(response.count > 0){
					jQuery('#notifymebell').html(response.count).addClass('notfications');
					if(window.notifications < response.count){
						notifyme_fire_notification(response.count + ' new notifications in your CRM','check them out');
						window.notifications = response.count;
					}
				}
			}
	    }), i.fail(function() {
			console.log("something broke");
	    })
	}
}