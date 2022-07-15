document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', submit_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function submit_email(event){
  // Cancel form submit
  event.preventDefault();
 
  //Submit form via API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => load_mailbox('sent')); //Go to the sent mailbox
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  const emailsView = document.querySelector('#emails-view');
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get emails
  fetch('emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {

    emails.forEach(email => {
      // Create email div
      const div = document.createElement('div');
      // Set the color background (read or unread)
      if (email['read']){
        div.className = "email_read";
      }else {
        div.className = "email_unread";
      }

      // Show the email line
      div.innerHTML = `
          <span class="col-md-auto"><b> ${email['sender']} </b></span>
          <span class="col"> ${email['subject']} </span>
          <span class="timestamp"> ${email['timestamp']} </span>
      `;

      // If the user click the email
      div.addEventListener('click',() => load_email(email['id']));
      // Add the email div
      emailsView.appendChild(div);
    });
  });
}

function load_email(id){

  fetch('/emails/' + id)
  .then(response => response.json())
  .then(email => {
    // Hide and show the views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    const emailView = document.querySelector('#email-view');

    // Show email info
    emailView.innerHTML = `
    <ul style="list-style-type:none">
      <li><b>From:</b> <span>${email['sender']} </span></li>
      <li><b>To:</b> <span> ${email['recipients']} </span></li>
      <li><b>Subject:</b> <span> ${email['subject']} </span></li>
      <li><b>Timestamp:</b> <span> ${email['timestamp']} </span></li>
    </ul>
    <div id="buttons"></div>
    <hr>
    <p> ${email['body']} <br> </p>
    `;

    const buttons = document.querySelector('#buttons');

    // Mark email has read
    if (!email['read']){
      fetch('/emails/' + id, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    if (document.querySelector('#user-email').textContent !== email['sender']){
      // Create archive button
      const archiveButton = document.createElement('button');
      archiveButton.className = "btn btn-sm btn-outline-primary";
      if (email['archived']){
        archiveButton.innerHTML = 'Unarchive';
      } else {
        archiveButton.innerHTML = 'Archive';
      }

      archiveButton.addEventListener('click', () => {
        fetch('/emails/' + email['id'], {
          method: 'PUT',
          body: JSON.stringify({ archived: !email['archived'] })
        })
        .then(response => load_mailbox('inbox'))
      });
      buttons.appendChild(archiveButton);

      // Create a reply button
      const replyButton = document.createElement('button');
      replyButton.className = "btn btn-sm btn-outline-primary";
      replyButton.innerHTML = 'Reply';

      replyButton.addEventListener('click', () => {
        compose_email();
        // Prefill the recipients field
        document.querySelector('#compose-recipients').value = email['sender'];
        
        // Prefill the subject field
        let subject = email['subject'];
        if (subject.split(" ", 1)[0] != "Re:") {
          subject = "Re: " + subject;
        }
        document.querySelector('#compose-subject').value = subject;

        // Prefill the body field
        let bodyReply = document.querySelector('#compose-body');
        bodyReply.value = `On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}`+'\n';
        bodyReply.focus();
      })
      buttons.appendChild(replyButton);
    }    
  });
}