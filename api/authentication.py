"""
api/authentication.py

Custom JWT authentication that intercepts inactive/suspended users and
returns a consistent error_code so the frontend interceptor can redirect.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SuspendedUserError(AuthenticationFailed):
    """
    A distinct exception class for suspended users.
    We set status_code=403 so it's distinguishable from generic 401s,
    and the frontend's existing 403 handler already routes to account_suspended.
    """
    status_code = 403
    default_detail = 'Your account has been suspended.'
    default_code = 'account_suspended'

    def __init__(self):
        super().__init__(detail={
            'detail': self.default_detail,
            'error_code': 'account_suspended',
        })


class NourishJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        try:
            result = super().authenticate(request)
            # result is (user, token) or None
            if result is not None:
                user, token = result
                if not user.is_active:
                    raise SuspendedUserError()
            return result
        except SuspendedUserError:
            raise
        except AuthenticationFailed as e:
            # Catch any other inactive-related error SimpleJWT might raise
            detail = ''
            if hasattr(e, 'detail'):
                detail = str(e.detail).lower()
            if 'inactive' in detail or 'not active' in detail:
                raise SuspendedUserError()
            raise