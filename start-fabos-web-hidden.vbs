Option Explicit

Dim shell, fso, folder, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

folder = fso.GetParentFolderName(WScript.ScriptFullName)
command = "cmd /c """ & folder & "\start-fabos-web.bat"""
shell.Run command, 0, False
