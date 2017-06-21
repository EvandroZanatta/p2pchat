{include file="header.tpl"}

<script>
    window.fbAsyncInit = function() {
        FB.init({
            appId: '1961633604067369',
            cookie: true,
            xfbml: true,
            version: 'v2.8'
        });
        FB.AppEvents.logPageView();
    };

    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
</script>
<h1>P2P Chat</h1>

<fb:login-button scope="public_profile,email" onlogin="checkLoginState();">
</fb:login-button>

<script>

    function getUser(userid) {
        FB.api(
            "/"+userid+'?fields=email',
            function(response) {
                if (response && !response.error) {
                    /* handle the result */
                    console.log("ok");
                    console.log(response);
                }
            }
        );
        
        FB.api(
            "/"+userid+"/picture?type=large",
            function (response) {
              if (response && !response.error) {
                console.log("ok2");
                console.log(response);
              }
            }
        );
    }

    function checkLoginState() {
        FB.getLoginStatus(function(response) {
            console.log(response);
        });

        FB.api('/me', function(response) {
            getUser(response.id);
        });
    }
</script>