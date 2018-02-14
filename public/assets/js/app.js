$( document ).ready(function(){
  // materialize nav bar collapse functionality
  $('.button-collapse').sideNav();

  // when save article button is clicked
  $('.save-article-button').on('click', function() {
    // grab _id from saved data attribute
    var dbId = $(this).data('dbid');
    // ajax put method to articles/_id
    // send data { saved: true } back
    $.ajax({
      method: "PUT",
      url: "/articles/" + dbId,
      data: { saved: true }
      // when done, log it
    }).done(function(data) {
      console.log(data);
    });
    // update button html to article saved
    $(this).html("Article saved.");
  });
  
  // when delete from saved is clicked, update db to change saved to false
  $('.delete-from-saved-button').on('click', function() {
    var dbId = $(this).data('dbid');
    // ajax put method to articles/_id
    // send data { saved: false } back
    $.ajax({
      method: "PUT",
      url: "/articles/" + dbId,
      data: { saved: false }
    }).done(function(data) {
      // when done, reload page so article is removed from saved page
      location.reload();
    })
  });
});