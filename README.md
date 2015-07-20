There are two html pages.

1.  index.html
    - This page take data of employee and store into pouchdb and then replicate it to the local couchdb.
  	- Code in app.js
  	
2.  ReadData.html
    - This page replicate employee data from local couch to pouchdb.
    - Here i implemented transform-pouch for data encrypt and decrypt.
    - Code in app2.js
    
3.  Problem:
  	- Problem is in app2.js file on line no: 115 in outgoing function.
  	- i am not able to identify how transform-pouch output function is getting alredy decrypted data.
  	- just comment 118,125,126,127 in app2.js file then you will identify error.
	    
