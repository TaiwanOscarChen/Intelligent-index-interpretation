import datetime
import pytz

TW_TZ = pytz.timezone("Asia/Taipei")

print("datetime.now():", datetime.datetime.now())
print("datetime.now(TW_TZ):", datetime.datetime.now(TW_TZ))
print("datetime.now(timezone(8)):", datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))))
