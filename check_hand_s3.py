import s3fs

fs = s3fs.S3FileSystem(anon=True)
print("Root:", fs.ls('s3://glo-30-hand/'))
try:
    print("v1:", fs.ls('s3://glo-30-hand/v1/'))
    print("v1/2021:", fs.ls('s3://glo-30-hand/v1/2021/'))
except Exception as e:
    print(e)
